import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { ScriptSchema, type Script } from "./render/script-schema.js";
import { loadConfig } from "./config.js";
import { createTtsClient } from "./tts/tts-client.js";
import { fetchImage } from "./assets/image-fetcher.js";
import { getDurationSec, concatWithSilence } from "./assets/audio-tools.js";
import { composeHtml } from "./render/html-composer.js";
import { renderWithHyperframes } from "./render/hyperframes-runner.js";
import { log } from "./utils/logger.js";

const TOTAL_STEPS = 8;
const DURATION_MIN_SEC = 48;
const DURATION_MAX_SEC = 72;
const SCENE_GAP_SEC = 0.3;

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "render", "templates");

const HYPERFRAMES_CONFIG = {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: {
    blocks: "compositions",
    components: "compositions/components",
    assets: "assets",
  },
};

export async function runPipeline(scriptPath: string): Promise<void> {
  const cfg = loadConfig();
  const outputDir = dirname(scriptPath);
  log.info(`Output directory: ${outputDir}`);

  // STEP 1
  log.step(1, TOTAL_STEPS, `Load env + validate script.json (TTS provider: ${cfg.ttsProvider})`);
  const raw = JSON.parse(await readFile(scriptPath, "utf8"));
  // Substitute env placeholder before validation (works for both providers)
  if (raw.voice?.voiceId === "${VIETNAMESE_VOICEID}" || raw.voice?.voiceId === "${VOICE_ID}") {
    raw.voice.voiceId = cfg.ttsProvider === "lucylab" ? cfg.lucylabVoiceId! : cfg.elevenlabsVoiceId!;
  }
  const script: Script = ScriptSchema.parse(raw);

  // STEP 2
  log.step(2, TOTAL_STEPS, "Write script.txt for CapCut");
  const fullText = script.scenes.map((s) => s.voiceText).join("\n\n");
  await writeFile(join(outputDir, "script.txt"), fullText);

  // STEP 3 + 4 in parallel
  log.step(3, TOTAL_STEPS, "Fetch og:image (parallel) + Step 4 TTS");
  const imgPath = join(outputDir, "images", "bg.jpg");
  const imgPromise = fetchImage(script.metadata.source.image, imgPath);

  // STEP 4
  const ttsClient = createTtsClient(cfg);
  // Concurrency: LucyLab requires 1 (only 1 concurrent export per key);
  // ElevenLabs supports parallel calls but we keep 1 by default to be polite.
  const limit = pLimit(cfg.ttsConcurrency);
  const voiceDir = join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });

  const sceneAudioPromises = script.scenes.map((scene) =>
    limit(async () => {
      const out = join(voiceDir, `scene-${scene.id}.mp3`);
      const srtOut = join(voiceDir, `scene-${scene.id}.srt`);
      log.info(`  TTS scene ${scene.id} (${scene.voiceText.length} chars)...`);
      await ttsClient.generate(scene.voiceText, out, srtOut);
      const dur = await getDurationSec(out);
      log.info(`  scene ${scene.id}: ${dur.toFixed(2)}s`);
      return { id: scene.id, path: out, durationSec: dur };
    }),
  );

  const [imgResult, sceneAudio] = await Promise.all([
    imgPromise,
    Promise.all(sceneAudioPromises),
  ]);

  let bgImageRelPath: string | null = null;
  if (imgResult.success) {
    bgImageRelPath = "images/bg.jpg";
  } else {
    log.warn(`Background image fetch failed: ${imgResult.reason} → using gradient fallback`);
  }

  // STEP 5
  log.step(5, TOTAL_STEPS, "Concat voice scenes with 0.3s silence");
  const voiceMp3 = join(outputDir, "voice.mp3");
  await concatWithSilence(sceneAudio.map((a) => a.path), SCENE_GAP_SEC, voiceMp3);
  const totalAudioSec = await getDurationSec(voiceMp3);
  log.info(`  voice.mp3 total: ${totalAudioSec.toFixed(2)}s`);
  if (totalAudioSec < DURATION_MIN_SEC || totalAudioSec > DURATION_MAX_SEC) {
    log.warn(`Total duration ${totalAudioSec.toFixed(1)}s outside [${DURATION_MIN_SEC}, ${DURATION_MAX_SEC}]s tolerance — proceeding anyway`);
  }

  // STEP 6 — Compose HTML + write hyperframes project files
  log.step(6, TOTAL_STEPS, "Compose HTML + project files");

  // Resolve TikTok avatar — download URL if provided, else copy bundled default
  const ttAvatarFile = "tiktok-avatar.jpg";
  const ttAvatarOut = join(outputDir, ttAvatarFile);
  if (cfg.tiktok.avatarUrl) {
    const r = await fetchImage(cfg.tiktok.avatarUrl, ttAvatarOut);
    if (!r.success) {
      log.warn(`TikTok avatar download failed: ${r.reason} → falling back to bundled default`);
      await copyFile(join(__dirname, "..", "assets", "avatar.jpg"), ttAvatarOut);
    }
  } else {
    await copyFile(join(__dirname, "..", "assets", "avatar.jpg"), ttAvatarOut);
  }

  const html = composeHtml({
    script,
    sceneAudio: sceneAudio.map((a) => ({ id: a.id, durationSec: a.durationSec })),
    gapSec: SCENE_GAP_SEC,
    bgImageRelPath,
    audioRelPath: "voice.mp3",
    tiktok: cfg.tiktok,
    tiktokAvatarRelPath: ttAvatarFile,
  });

  // hyperframes expects: index.html (NOT composition.html), hyperframes.json, meta.json in DIR
  await writeFile(join(outputDir, "index.html"), html);

  await writeFile(join(outputDir, "hyperframes.json"), JSON.stringify(HYPERFRAMES_CONFIG, null, 2));

  const slug = basename(outputDir);
  await writeFile(join(outputDir, "meta.json"), JSON.stringify({
    id: slug,
    name: script.metadata.title,
    createdAt: new Date().toISOString(),
  }, null, 2));

  // Copy templates next to the index.html so relative paths resolve
  await copyFile(join(TPL_DIR, "styles.css"),    join(outputDir, "styles.css"));
  await copyFile(join(TPL_DIR, "animations.js"), join(outputDir, "animations.js"));

  // STEP 7
  log.step(7, TOTAL_STEPS, "Render with hyperframes");
  const videoPath = join(outputDir, "video.mp4");
  await renderWithHyperframes({ compositionDir: outputDir, outputPath: videoPath });

  // STEP 8
  log.step(8, TOTAL_STEPS, "Done");
  console.log("\n=== Result ===");
  console.log(`Video:  ${videoPath}`);
  console.log(`Audio:  ${voiceMp3}  (cho CapCut)`);
  console.log(`Script: ${join(outputDir, "script.txt")}  (cho CapCut auto-caption)`);
  console.log(`Tong thoi luong: ${totalAudioSec.toFixed(2)}s`);
}
