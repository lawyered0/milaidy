import { EventEmitter } from "node:events";
import type http from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleDatabaseRoute } from "./database.js";

function createMockRequest(
  method: string,
  url: string,
  body: unknown,
): http.IncomingMessage & EventEmitter {
  const req = new EventEmitter() as http.IncomingMessage &
    EventEmitter & { destroy: () => void };
  req.method = method;
  req.url = url;
  req.headers = { host: "localhost:2138" };
  req.destroy = vi.fn();

  const encoded = Buffer.from(JSON.stringify(body), "utf-8");
  queueMicrotask(() => req.emit("data", encoded));
  queueMicrotask(() => req.emit("end"));
  return req;
}

function createMockResponse(): {
  res: http.ServerResponse;
  getStatus: () => number;
  getJson: () => unknown;
} {
  let statusCode = 200;
  let payload = "";

  const res = {
    set statusCode(value: number) {
      statusCode = value;
    },
    get statusCode() {
      return statusCode;
    },
    setHeader: () => undefined,
    end: (chunk?: string | Buffer) => {
      payload = chunk ? chunk.toString() : "";
    },
  } as unknown as http.ServerResponse;

  return {
    res,
    getStatus: () => statusCode,
    getJson: () => (payload ? JSON.parse(payload) : null),
  };
}

describe("database API host validation", () => {
  const prevBind = process.env.MILAIDY_API_BIND;

  beforeEach(() => {
    process.env.MILAIDY_API_BIND = "0.0.0.0";
  });

  afterEach(() => {
    if (prevBind === undefined) {
      delete process.env.MILAIDY_API_BIND;
    } else {
      process.env.MILAIDY_API_BIND = prevBind;
    }
  });

  it("blocks fd00::/8 in POST /api/database/test", async () => {
    const req = createMockRequest("POST", "/api/database/test", {
      host: "fd00::1",
      user: "postgres",
      database: "postgres",
    });
    const { res, getStatus, getJson } = createMockResponse();

    const handled = await handleDatabaseRoute(req, res, null, "/api/database/test");

    expect(handled).toBe(true);
    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({
      error:
        'Connection to "fd00::1" is blocked: link-local and metadata addresses are not allowed.',
    });
  });

  it("blocks fd00::/8 in PUT /api/database/config", async () => {
    const req = createMockRequest("PUT", "/api/database/config", {
      provider: "postgres",
      postgres: {
        host: "fd12::abcd",
      },
    });
    const { res, getStatus, getJson } = createMockResponse();

    const handled = await handleDatabaseRoute(
      req,
      res,
      null,
      "/api/database/config",
    );

    expect(handled).toBe(true);
    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({
      error:
        'Connection to "fd12::abcd" is blocked: link-local and metadata addresses are not allowed.',
    });
  });
});
