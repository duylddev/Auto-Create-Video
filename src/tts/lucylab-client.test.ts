import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LucylabClient } from "./lucylab-client.js";

const cfg = {
  apiKey: "sk_test_abc",
  voiceId: "v1",
  endpoint: "https://api.lucylab.io/json-rpc",
  pollIntervalMs: 50,
  pollTimeoutMs: 5000,
  ttsConcurrency: 3,
};

let tmpDir: string;

beforeEach(() => {
  nock.cleanAll();
  tmpDir = mkdtempSync(join(tmpdir(), "lucylab-test-"));
});

afterEach(() => {
  nock.cleanAll();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("LucylabClient", () => {
  it("submits text + polls until done + downloads audio", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "ttsLongText" && b.params.text === "xin chào")
      .reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-1" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "getExportStatus")
      .reply(200, { jsonrpc: "2.0", id: "2", result: { status: "pending" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "getExportStatus")
      .reply(200, { jsonrpc: "2.0", id: "3", result: { status: "done", url: "https://cdn.lucylab.io/exp-1.mp3" } });

    nock("https://cdn.lucylab.io").get("/exp-1.mp3").reply(200, Buffer.from("MP3DATA"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("xin chào", out);
    expect(readFileSync(out).toString()).toBe("MP3DATA");
  });

  it("retries on 5xx with backoff", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-2" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "2", result: { status: "done", url: "https://cdn.lucylab.io/exp-2.mp3" } });

    nock("https://cdn.lucylab.io").get("/exp-2.mp3").reply(200, Buffer.from("OK"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  }, 15000);  // larger timeout because of backoff delays

  it("throws if poll exceeds timeout", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-3" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").times(200).reply(200, { jsonrpc: "2.0", id: "x", result: { status: "pending" } });

    const fastCfg = { ...cfg, pollTimeoutMs: 200, pollIntervalMs: 50 };
    const client = new LucylabClient(fastCfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/timeout|exp-3/);
  });

  it("throws if status=failed", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-4" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, {
        jsonrpc: "2.0", id: "2",
        result: { status: "failed", error: "voice unavailable" },
      });

    const client = new LucylabClient(cfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/failed|voice unavailable/);
  });
});
