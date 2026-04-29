import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Script } from "./script-schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "templates");

export interface SceneAudio {
  id: string;
  durationSec: number;
}

export interface ComposeArgs {
  script: Script;
  sceneAudio: SceneAudio[];
  gapSec: number;
  bgImageRelPath: string | null;   // null => fallback gradient
  audioRelPath: string;
}

export function composeHtml(args: ComposeArgs): string {
  const { script, sceneAudio, gapSec, bgImageRelPath, audioRelPath } = args;

  // Compute timing per scene
  let cursor = 0;
  const timing = script.scenes.map((scene) => {
    const audio = sceneAudio.find((a) => a.id === scene.id);
    if (!audio) throw new Error(`No audio entry for scene id=${scene.id}`);
    const dur = audio.durationSec + gapSec;
    const start = cursor;
    cursor += dur;
    return { scene, start, duration: dur };
  });
  const totalDuration = cursor;

  const sceneHtml = timing.map(({ scene, start, duration }) =>
    renderScene(scene, start, duration, bgImageRelPath)
  ).join("\n");

  const tpl = readFileSync(join(TPL_DIR, "base.html.tmpl"), "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHtml(script.metadata.title))
    .replace(/\{\{TOTAL_DURATION\}\}/g, totalDuration.toFixed(2))
    .replace("{{SCENES}}", sceneHtml)
    .replace(/src="voice\.mp3"/g, `src="${audioRelPath}"`);
}

function renderScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  bgImage: string | null,
): string {
  const bg = renderBackground(scene.visual.background, bgImage);
  const overlay = scene.visual.overlay
    ? `<div class="overlay" style="opacity: ${scene.visual.overlay.darkness}"></div>`
    : "";
  const text = renderText(scene.visual.text);
  const fx = (scene.visual.effects ?? []).map((e) => `<div class="fx ${e}"></div>`).join("");

  return `
<div class="scene" id="scene-${scene.id}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-active="0">
  ${bg}
  ${overlay}
  ${text}
  ${fx}
</div>`.trim();
}

function renderBackground(
  bg: Script["scenes"][number]["visual"]["background"],
  imagePath: string | null,
): string {
  if (bg.type === "image") {
    if (!imagePath) {
      // Fallback gradient when image fetch failed
      return `<div class="bg gradient-news-dark"></div>`;
    }
    // Strip "-slow" suffix from kenBurns enum to match CSS class names (kb-pan-left, etc.)
    const kbBase = bg.kenBurns.replace(/-slow$/, "");
    return `<div class="bg kb-${kbBase}" style="background-image: url('${imagePath}')"></div>`;
  } else {
    return `<div class="bg gradient-${bg.preset}"></div>`;
  }
}

function renderText(text: Script["scenes"][number]["visual"]["text"]): string {
  const lines = text.lines.map((l) =>
    `<span class="line style-${text.style} emp-${l.emphasis}" data-animation="${l.animation}">${escapeHtml(l.content)}</span>`,
  ).join("\n");
  return `<div class="text-block pos-${text.position}">\n${lines}\n</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
