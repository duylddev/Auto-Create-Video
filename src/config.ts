import "dotenv/config";

export interface Config {
  apiKey: string;
  voiceId: string;
  endpoint: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  ttsConcurrency: number;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing required env var ${name}. ` +
      `Copy .env.example to .env.local and fill in the values.`
    );
  }
  return v;
}

function intDefault(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = parseInt(v, 10);
  if (isNaN(n)) throw new Error(`Env var ${name} must be integer, got "${v}"`);
  return n;
}

export function loadConfig(): Config {
  return {
    apiKey: required("VIETNAMESE_API_KEY"),
    voiceId: required("VIETNAMESE_VOICEID"),
    endpoint: process.env.LUCYLAB_ENDPOINT ?? "https://api.lucylab.io/json-rpc",
    pollIntervalMs: intDefault("LUCYLAB_POLL_INTERVAL_MS", 2000),
    pollTimeoutMs: intDefault("LUCYLAB_POLL_TIMEOUT_MS", 120000),
    ttsConcurrency: intDefault("TTS_CONCURRENCY", 3),
  };
}
