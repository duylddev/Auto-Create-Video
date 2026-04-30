import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TtsClient } from "./tts-client.js";

const execFileAsync = promisify(execFile);

export interface VieneuOpts {
  apiBase: string;
  modelId: string;
  voiceId?: string;
}

function buildPythonScript(): string {
  return String.raw`
import sys
from vieneu import Vieneu

api_base = sys.argv[1]
model_id = sys.argv[2]
out_path = sys.argv[3]
text = sys.argv[4]
voice_id = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None

try:
    tts = Vieneu(
        mode='remote',
        api_base=api_base,
        model_name=model_id,
        codec_repo='neuphonic/neucodec-onnx-decoder-int8'
    )
    if voice_id:
        voice = tts.get_preset_voice(voice_id)
        audio = tts.infer(text=text, voice=voice)
    else:
        audio = tts.infer(text=text)
    tts.save(audio, out_path)
except Exception as exc:
    print(str(exc), file=sys.stderr)
    raise
`;
}

export class VieneuClient implements TtsClient {
  constructor(private cfg: VieneuOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    try {
      await execFileAsync(
        "python3",
        [
          "-c",
          buildPythonScript(),
          this.cfg.apiBase,
          this.cfg.modelId,
          audioOutPath,
          text,
          this.cfg.voiceId ?? "",
        ],
        { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
      );
    } catch (error) {
      const err = error as NodeJS.ErrnoException & { stderr?: string; code?: string | number };
      if (err.code === "ENOENT") {
        throw new Error("VieNeu remote TTS failed: Python binary not found: python3");
      }
      const detail = err.stderr?.trim() || err.message || String(error);
      throw new Error(`VieNeu remote TTS failed: ${detail}`);
    }
  }
}
