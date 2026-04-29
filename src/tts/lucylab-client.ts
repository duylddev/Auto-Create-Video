import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { Config } from "../config.js";

interface JsonRpcOk<T> { jsonrpc: "2.0"; id: string; result: T; }
interface JsonRpcErr { jsonrpc: "2.0"; id: string; error: { code: number; message: string }; }
type JsonRpcResp<T> = JsonRpcOk<T> | JsonRpcErr;

interface ExportStatus {
  status: "pending" | "running" | "done" | "failed";
  url?: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LucylabClient {
  constructor(private cfg: Config) {}

  async generate(text: string, outPath: string): Promise<void> {
    const exportId = await this.submitWithRetry(text);
    const url = await this.pollUntilDone(exportId);
    await this.download(url, outPath);
  }

  private async rpc<T>(method: string, params: unknown, idHint: string): Promise<T> {
    const resp = await axios.post<JsonRpcResp<T>>(
      this.cfg.endpoint,
      { jsonrpc: "2.0", method, params, id: idHint },
      {
        headers: {
          Authorization: `Bearer ${this.cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );
    const body = resp.data;
    if ("error" in body) {
      throw new Error(`LucyLab ${method} error: ${body.error.message}`);
    }
    return body.result;
  }

  private async submitWithRetry(text: string): Promise<string> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const result = await this.rpc<{ exportId: string }>(
          "ttsLongText",
          { text, voiceId: this.cfg.voiceId, speed: 1.0 },
          `submit-${Date.now()}`,
        );
        return result.exportId;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        const retryable = status === undefined || status >= 500;
        if (!retryable || attempt === delays.length) throw e;
        await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }

  private async pollUntilDone(exportId: string): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < this.cfg.pollTimeoutMs) {
      const status = await this.rpc<ExportStatus>(
        "getExportStatus",
        { exportId },
        `poll-${Date.now()}`,
      );
      if (status.status === "done") {
        if (!status.url) throw new Error(`LucyLab returned status=done without url for ${exportId}`);
        return status.url;
      }
      if (status.status === "failed") {
        throw new Error(`LucyLab export ${exportId} failed: ${status.error ?? "unknown"}`);
      }
      await sleep(this.cfg.pollIntervalMs);
    }
    throw new Error(`LucyLab export ${exportId} polling timeout after ${this.cfg.pollTimeoutMs}ms`);
  }

  private async download(url: string, outPath: string): Promise<void> {
    const resp = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer", timeout: 60000 });
    await writeFile(outPath, Buffer.from(resp.data));
  }
}
