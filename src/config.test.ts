import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "TTS_PROVIDER",
  "VIETNAMESE_API_KEY",
  "VIETNAMESE_VOICEID",
  "LUCYLAB_ENDPOINT",
  "LUCYLAB_POLL_INTERVAL_MS",
  "LUCYLAB_POLL_TIMEOUT_MS",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "ELEVENLABS_ENDPOINT",
  "VIENEU_API_BASE",
  "VIENEU_MODEL_ID",
  "VIENEU_VOICE_ID",
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

  describe("LucyLab provider (default)", () => {
    it("reads LucyLab env vars when no provider specified", () => {
      process.env.VIETNAMESE_API_KEY = "sk_test_abc";
      process.env.VIETNAMESE_VOICEID = "voice123";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("lucylab");
      expect(cfg.lucylabApiKey).toBe("sk_test_abc");
      expect(cfg.lucylabVoiceId).toBe("voice123");
    });

    it("throws when VIETNAMESE_API_KEY missing", () => {
      process.env.VIETNAMESE_VOICEID = "voice123";
      expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
    });

    it("uses sensible defaults for optional vars", () => {
      process.env.VIETNAMESE_API_KEY = "k";
      process.env.VIETNAMESE_VOICEID = "v";
      const cfg = loadConfig();
      expect(cfg.lucylabEndpoint).toBe("https://api.lucylab.io/json-rpc");
      expect(cfg.lucylabPollIntervalMs).toBe(2000);
      expect(cfg.lucylabPollTimeoutMs).toBe(120000);
      expect(cfg.ttsConcurrency).toBe(1);
    });
  });

  describe("ElevenLabs provider", () => {
    it("reads ElevenLabs env vars when TTS_PROVIDER=elevenlabs", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "sk_eleven_xyz";
      process.env.ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("elevenlabs");
      expect(cfg.elevenlabsApiKey).toBe("sk_eleven_xyz");
      expect(cfg.elevenlabsVoiceId).toBe("EXAVITQu4vr4xnSDxMaL");
      expect(cfg.elevenlabsModelId).toBe("eleven_multilingual_v2");
      expect(cfg.elevenlabsEndpoint).toBe("https://api.elevenlabs.io/v1");
    });

    it("throws when ELEVENLABS_API_KEY missing", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_VOICE_ID = "v";
      expect(() => loadConfig()).toThrow(/ELEVENLABS_API_KEY/);
    });

    it("respects ELEVENLABS_MODEL_ID override", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "k";
      process.env.ELEVENLABS_VOICE_ID = "v";
      process.env.ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";
      const cfg = loadConfig();
      expect(cfg.elevenlabsModelId).toBe("eleven_turbo_v2_5");
    });
  });


  describe("VieNeu provider", () => {
    it("reads VieNeu env vars when TTS_PROVIDER=vieneu", () => {
      process.env.TTS_PROVIDER = "vieneu";
      process.env.VIENEU_API_BASE = "http://127.0.0.1:23333/v1";
      process.env.VIENEU_MODEL_ID = "pnnbao-ump/VieNeu-TTS";
      process.env.VIENEU_VOICE_ID = "bac-si-tuyen";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("vieneu");
      expect(cfg.vieneuApiBase).toBe("http://127.0.0.1:23333/v1");
      expect(cfg.vieneuModelId).toBe("pnnbao-ump/VieNeu-TTS");
      expect(cfg.vieneuVoiceId).toBe("bac-si-tuyen");
    });

    it("throws when VIENEU_API_BASE missing", () => {
      process.env.TTS_PROVIDER = "vieneu";
      expect(() => loadConfig()).toThrow(/VIENEU_API_BASE/);
    });
  });

  it("rejects invalid TTS_PROVIDER", () => {
    process.env.TTS_PROVIDER = "google";
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
