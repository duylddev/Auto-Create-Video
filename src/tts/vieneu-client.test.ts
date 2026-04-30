import { beforeEach, describe, expect, it, vi } from "vitest";

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

import { VieneuClient } from "./vieneu-client.js";

const opts = {
  apiBase: "http://127.0.0.1:23333/v1",
  modelId: "pnnbao-ump/VieNeu-TTS",
  voiceId: "bac-si-tuyen",
};

describe("VieneuClient", () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it("calls python remote-mode synthesis with configured server", async () => {
    execFileMock.mockImplementation((_file: string, _args: string[], _options: unknown, cb: Function) => cb(null, "", ""));

    const client = new VieneuClient(opts);
    await client.generate("Xin chào", "output.wav");

    expect(execFileMock).toHaveBeenCalledTimes(1);
    const [file, args] = execFileMock.mock.calls[0];
    expect(file).toBe("python3");
    expect(args).toContain("-c");
    expect(args).toContain(opts.apiBase);
    expect(args).toContain(opts.modelId);
    expect(args).toContain("output.wav");
    expect(args).toContain("Xin chào");
    expect(args).toContain(opts.voiceId);
  });

  it("works without explicit preset voice", async () => {
    execFileMock.mockImplementation((_file: string, _args: string[], _options: unknown, cb: Function) => cb(null, "", ""));

    const client = new VieneuClient({ ...opts, voiceId: undefined });
    await client.generate("Xin chào", "output.wav", "output.srt");

    const [, args] = execFileMock.mock.calls[0];
    expect(args.at(-1)).toBe("");
  });

  it("throws clear error when python binary is missing", async () => {
    execFileMock.mockImplementation((_file: string, _args: string[], _options: unknown, cb: Function) => {
      const err = Object.assign(new Error("spawn python3 ENOENT"), { code: "ENOENT" });
      cb(err, "", "");
    });

    const client = new VieneuClient(opts);
    await expect(client.generate("Xin chào", "output.wav")).rejects.toThrow(/Python binary not found/);
  });

  it("surfaces stderr from failed python execution", async () => {
    execFileMock.mockImplementation((_file: string, _args: string[], _options: unknown, cb: Function) => {
      const err = Object.assign(new Error("process exited"), { stderr: "missing vieneu package" });
      cb(err, "", "missing vieneu package");
    });

    const client = new VieneuClient(opts);
    await expect(client.generate("Xin chào", "output.wav")).rejects.toThrow(/missing vieneu package/);
  });
});
