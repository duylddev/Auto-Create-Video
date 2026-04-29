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

export async function concatWithSilence(
  inputPaths: string[],
  gapSec: number,
  outPath: string,
): Promise<void> {
  if (inputPaths.length === 0) throw new Error("concatWithSilence: empty inputPaths");

  const tmp = await mkdtemp(join(tmpdir(), "concat-"));
  try {
    // Generate silence
    const silencePath = join(tmp, "silence.mp3");
    await run("ffmpeg", [
      "-y", "-f", "lavfi",
      "-i", `anullsrc=r=44100:cl=mono`,
      "-t", String(gapSec),
      "-c:a", "libmp3lame", "-b:a", "128k",
      silencePath,
    ]);

    // Build concat list file — resolve to absolute paths and normalize to
    // forward slashes so ffmpeg can locate files regardless of cwd.
    const normalize = (p: string) => resolve(p).replace(/\\/g, "/");
    const items: string[] = [];
    inputPaths.forEach((p, i) => {
      items.push(`file '${normalize(p).replace(/'/g, "'\\''")}'`);
      if (i < inputPaths.length - 1) {
        items.push(`file '${normalize(silencePath).replace(/'/g, "'\\''")}'`);
      }
    });
    const listPath = join(tmp, "list.txt");
    await writeFile(listPath, items.join("\n"));

    await run("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0",
      "-i", listPath,
      "-c", "copy",
      outPath,
    ]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
