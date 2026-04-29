import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "VIETNAMESE_API_KEY",
  "VIETNAMESE_VOICEID",
  "LUCYLAB_ENDPOINT",
  "LUCYLAB_POLL_INTERVAL_MS",
  "LUCYLAB_POLL_TIMEOUT_MS",
  "TTS_CONCURRENCY",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  it("reads required env vars", () => {
    process.env.VIETNAMESE_API_KEY = "sk_test_abc";
    process.env.VIETNAMESE_VOICEID = "voice123";
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("sk_test_abc");
    expect(cfg.voiceId).toBe("voice123");
  });

  it("throws when VIETNAMESE_API_KEY is missing", () => {
    process.env.VIETNAMESE_VOICEID = "voice123";
    expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
  });

  it("uses sensible defaults for optional vars", () => {
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    const cfg = loadConfig();
    expect(cfg.endpoint).toBe("https://api.lucylab.io/json-rpc");
    expect(cfg.pollIntervalMs).toBe(2000);
    expect(cfg.pollTimeoutMs).toBe(120000);
    expect(cfg.ttsConcurrency).toBe(3);
  });

  it("respects overrides", () => {
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    process.env.LUCYLAB_ENDPOINT = "https://test.example/rpc";
    process.env.TTS_CONCURRENCY = "5";
    const cfg = loadConfig();
    expect(cfg.endpoint).toBe("https://test.example/rpc");
    expect(cfg.ttsConcurrency).toBe(5);
  });
});
