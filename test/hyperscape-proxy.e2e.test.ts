import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApiServer } from "../src/api/server.js";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

interface ApiResponse {
  status: number;
  data: JsonValue;
}

interface ApiRequestOptions {
  body?: string;
  headers?: Record<string, string>;
}

interface CapturedUpstreamRequest {
  method: string;
  path: string;
  body: string;
  authorization: string | null;
  contentType: string | null;
}

function parseJson(raw: string): JsonValue {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return { _raw: raw };
  }
}

function asObject(value: JsonValue): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function requestApi(
  port: number,
  method: string,
  path: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const body = options?.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          ...(body
            ? {
                "Content-Type":
                  options?.headers?.["Content-Type"] ?? "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
          ...(options?.headers ?? {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf-8");
          resolve({
            status: res.statusCode ?? 0,
            data: parseJson(raw),
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function readRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

describe("Hyperscape proxy E2E", () => {
  let apiPort = 0;
  let closeApi: () => Promise<void>;
  let upstreamPort = 0;
  let upstreamServer: http.Server;
  let previousHyperscapeApiUrl: string | undefined;
  const capturedRequests: CapturedUpstreamRequest[] = [];

  beforeAll(async () => {
    upstreamServer = http.createServer(async (req, res) => {
      const method = req.method ?? "GET";
      const path = req.url ?? "/";
      const body = await readRequestBody(req);
      capturedRequests.push({
        method,
        path,
        body,
        authorization:
          typeof req.headers.authorization === "string"
            ? req.headers.authorization
            : null,
        contentType:
          typeof req.headers["content-type"] === "string"
            ? req.headers["content-type"]
            : null,
      });

      let payload: JsonObject = { success: true, method, path };
      if (
        method === "POST" &&
        /^\/api\/embedded-agents\/[^/]+\/command$/.test(path)
      ) {
        payload = {
          success: true,
          message: "upstream command ok",
          method,
          path,
          body: parseJson(body),
        };
      } else if (
        method === "GET" &&
        /^\/api\/agents\/[^/]+\/goal$/.test(path)
      ) {
        payload = {
          success: true,
          goal: null,
          availableGoals: [],
          goalsPaused: false,
        };
      } else if (
        method === "GET" &&
        /^\/api\/agents\/[^/]+\/quick-actions$/.test(path)
      ) {
        payload = {
          success: true,
          nearbyLocations: [],
          availableGoals: [],
          quickCommands: [],
          inventory: [],
          playerPosition: null,
        };
      } else if (method === "GET" && path === "/api/embedded-agents") {
        payload = {
          success: true,
          agents: [],
          count: 0,
        };
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    });

    await new Promise<void>((resolve) => {
      upstreamServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = upstreamServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve mock Hyperscape upstream address");
    }
    upstreamPort = address.port;

    previousHyperscapeApiUrl = process.env.HYPERSCAPE_API_URL;
    process.env.HYPERSCAPE_API_URL = `http://127.0.0.1:${upstreamPort}`;

    const api = await startApiServer({ port: 0 });
    apiPort = api.port;
    closeApi = api.close;
  }, 30_000);

  afterAll(async () => {
    await closeApi();
    await new Promise<void>((resolve, reject) => {
      upstreamServer.close((err?: Error) => (err ? reject(err) : resolve()));
    });
    if (previousHyperscapeApiUrl === undefined) {
      delete process.env.HYPERSCAPE_API_URL;
    } else {
      process.env.HYPERSCAPE_API_URL = previousHyperscapeApiUrl;
    }
  });

  it("bridges agent message route into embedded chat command", async () => {
    const response = await requestApi(
      apiPort,
      "POST",
      "/api/apps/hyperscape/agents/agent-123/message",
      {
        body: JSON.stringify({ content: "hello proxy" }),
        headers: { Authorization: "Bearer test-token" },
      },
    );

    expect(response.status).toBe(200);
    const body = asObject(response.data);
    expect(body.success).toBe(true);
    expect(body.message).toBe("upstream command ok");

    const upstream = capturedRequests.at(-1);
    expect(upstream?.method).toBe("POST");
    expect(upstream?.path).toBe("/api/embedded-agents/agent-123/command");
    expect(upstream?.authorization).toBe("Bearer test-token");
    expect(parseJson(upstream?.body ?? "")).toEqual({
      command: "chat",
      data: { message: "hello proxy" },
    });
  });

  it("rejects empty message payload before upstream relay", async () => {
    const beforeCount = capturedRequests.length;
    const response = await requestApi(
      apiPort,
      "POST",
      "/api/apps/hyperscape/agents/agent-123/message",
      {
        body: JSON.stringify({}),
      },
    );
    expect(response.status).toBe(400);
    expect(capturedRequests.length).toBe(beforeCount);
  });

  it("relays lifecycle control routes without forcing empty json body", async () => {
    const response = await requestApi(
      apiPort,
      "POST",
      "/api/apps/hyperscape/embedded-agents/char-7/pause",
    );
    expect(response.status).toBe(200);

    const upstream = capturedRequests.at(-1);
    expect(upstream?.method).toBe("POST");
    expect(upstream?.path).toBe("/api/embedded-agents/char-7/pause");
    expect(upstream?.body).toBe("");
    expect(upstream?.contentType).toBeNull();
  });

  it("passes goal and quick-actions telemetry to the upstream API", async () => {
    const goal = await requestApi(
      apiPort,
      "GET",
      "/api/apps/hyperscape/agents/agent-xyz/goal",
    );
    expect(goal.status).toBe(200);
    expect(asObject(goal.data).success).toBe(true);

    const goalUpstream = capturedRequests.at(-1);
    expect(goalUpstream?.method).toBe("GET");
    expect(goalUpstream?.path).toBe("/api/agents/agent-xyz/goal");

    const quickActions = await requestApi(
      apiPort,
      "GET",
      "/api/apps/hyperscape/agents/agent-xyz/quick-actions",
    );
    expect(quickActions.status).toBe(200);
    expect(asObject(quickActions.data).success).toBe(true);

    const quickUpstream = capturedRequests.at(-1);
    expect(quickUpstream?.method).toBe("GET");
    expect(quickUpstream?.path).toBe("/api/agents/agent-xyz/quick-actions");
  });
});
