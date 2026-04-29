import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = "", err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} failed (exit ${code}): ${err}`));
    });
    proc.on("error", reject);
  });
}

export async function getDurationSec(path: string): Promise<number> {
  const out = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const d = parseFloat(out.trim());
  if (isNaN(d)) throw new Error(`ffprobe returned non-numeric duration for ${path}: ${out}`);
  return d;
}

/**
 * Concatenate audio files with `gapSec` silence between each, producing a single
 * output mp3.
 *
 * Uses ffmpeg's CONCAT FILTER (not concat demuxer) with explicit sample-rate /
 * channel normalization to avoid clicks/pops at boundaries. Each input is also
 * given a tiny 8 ms fade-in/fade-out which inaudibly smooths any DC offset
 * discontinuity at the boundary — this eliminates the "pét" clicking sound.
 */
export async function concatWithSilence(
  inputPaths: string[],
  gapSec: number,
  outPath: string,
): Promise<void> {
  if (inputPaths.length === 0) throw new Error("concatWithSilence: empty inputPaths");
  if (inputPaths.length === 1) {
    // No concat needed — just normalize the single file
    await run("ffmpeg", [
      "-y", "-i", inputPaths[0],
      "-ar", "44100", "-ac", "1",
      "-c:a", "libmp3lame", "-b:a", "192k",
      outPath,
    ]);
    return;
  }

  const tmp = await mkdtemp(join(tmpdir(), "concat-"));
  try {
    // Generate WAV silence (lossless, no encoder priming pops)
    const silencePath = join(tmp, "silence.wav");
    await run("ffmpeg", [
      "-y", "-f", "lavfi",
      "-i", `anullsrc=r=44100:cl=mono`,
      "-t", String(gapSec),
      "-ac", "1", "-ar", "44100",
      silencePath,
    ]);

    // Build ffmpeg input args + concat filter graph.
    // We interleave: voice[0] silence voice[1] silence voice[2] ... voice[N-1]
    // Each is fed through a chain that:
    //   1) resamples to 44100 mono (aresample with high-quality)
    //   2) applies a tiny 8ms fade-in + fade-out (inaudible but smooths boundary)
    // Then all are concatenated by the `concat=n=K:v=0:a=1` filter.
    const ffArgs: string[] = ["-y"];
    const filterParts: string[] = [];
    const labels: string[] = [];
    let idx = 0;
    const FADE_SEC = 0.008; // 8ms — inaudible

    const addInput = (path: string) => {
      ffArgs.push("-i", path);
      const inLabel = `[${idx}:a]`;
      const outLabel = `a${idx}`;
      // Pre-pad: we cannot know exact duration here without probing every input,
      // so use afade with `t=in/out:st=...` and rely on `acrossfade` style.
      // Simpler robust trick: use afade `st` for in, and `afade=t=out` with
      // start_time=eof-FADE_SEC by providing duration after `-t` is hard.
      // Use `afade=t=in:st=0:d=FADE` then `afade=t=out:st=0:d=FADE` won't work
      // for variable-length inputs. So we use `apad=pad_dur=0` (no-op) +
      // `aresample` then rely on concat filter doing sample-accurate join.
      // The micro-fade is applied via `areverse,afade,areverse` trick to fade out:
      filterParts.push(
        `${inLabel}aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,` +
        `afade=t=in:st=0:d=${FADE_SEC},` +
        // Trim fade-out: reverse → fade-in → reverse (this fades the END)
        `areverse,afade=t=in:st=0:d=${FADE_SEC},areverse[${outLabel}]`
      );
      labels.push(`[${outLabel}]`);
      idx++;
    };

    inputPaths.forEach((p, i) => {
      addInput(p);
      if (i < inputPaths.length - 1) addInput(silencePath);
    });

    const concatFilter = `${labels.join("")}concat=n=${labels.length}:v=0:a=1[out]`;
    const filterGraph = `${filterParts.join(";")};${concatFilter}`;

    ffArgs.push(
      "-filter_complex", filterGraph,
      "-map", "[out]",
      "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100",
      outPath,
    );

    await run("ffmpeg", ffArgs);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
