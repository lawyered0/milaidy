/**
 * Tests for sandbox-engine shell execution safety.
 *
 * Verifies command construction avoids shell interpolation by passing
 * arguments as arrays to child_process.execFileSync.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock command execution primitives before module import
vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
  spawn: vi.fn(),
}));

import { execFileSync } from "node:child_process";
import { DockerEngine } from "./sandbox-engine.js";

describe("sandbox-engine command safety", () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs image existence checks with argument array (no shell string)", () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error("not found");
    });

    const engine = new DockerEngine();
    const maliciousImage = "node:latest; touch /tmp/injected";
    const exists = engine.imageExists(maliciousImage);

    expect(exists).toBe(false);
    expect(vi.mocked(execFileSync)).toHaveBeenCalledWith(
      "docker",
      ["image", "inspect", maliciousImage],
      expect.objectContaining({ stdio: "ignore", timeout: 10000 }),
    );
  });

  it("runs containers with unescaped image strings as a single arg", async () => {
    vi.mocked(execFileSync).mockReturnValueOnce("runner-id\n");

    const engine = new DockerEngine();
    const opts = {
      image: "repo/image; touch /tmp/injected",
      name: "test-container",
      detach: true,
      mounts: [],
      env: {
        A: "1",
      },
      network: "bridge",
      user: "1000:1000",
      capDrop: [],
      memory: undefined,
      cpus: undefined,
      pidsLimit: undefined,
      readOnlyRoot: false,
    };

    await expect(engine.runContainer(opts)).resolves.toBe("runner-id");

    const call = vi.mocked(execFileSync).mock.calls[0];
    expect(call[0]).toBe("docker");
    expect(Array.isArray(call[1])).toBe(true);
    expect(call[1]).toContain("repo/image; touch /tmp/injected");
    expect((call[1] as string[]).join(" ")).toContain("repo/image; touch /tmp/injected");
    expect((call[1] as string[]).join(" ")).not.toContain(" && ");
  });
});
