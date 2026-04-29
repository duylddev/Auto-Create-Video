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

  // Separate body scenes to compute per-body layout index
  const bodySceneIds = script.scenes
    .filter((s) => s.type === "body")
    .map((s) => s.id);

  const sceneHtml = timing.map(({ scene, start, duration }) => {
    if (scene.type === "hook") {
      return renderHookScene(scene, start, duration, bgImageRelPath);
    } else if (scene.type === "outro") {
      return renderOutroScene(scene, start, duration, script.metadata);
    } else {
      // body
      const bodyIdx = bodySceneIds.indexOf(scene.id);
      const layoutIdx = bodyIdx % 4;
      return renderBodyScene(scene, start, duration, layoutIdx, bgImageRelPath);
    }
  }).join("\n");

  const animJs = readFileSync(join(TPL_DIR, "animations.js"), "utf8");

  const tpl = readFileSync(join(TPL_DIR, "base.html.tmpl"), "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHtml(script.metadata.title))
    .replace(/\{\{TOTAL_DURATION\}\}/g, totalDuration.toFixed(2))
    .replace("{{SCENES}}", sceneHtml)
    .replace(/src="voice\.mp3"/g, `src="${audioRelPath}"`)
    .replace('<script src="animations.js"></script>', `<script>\n${animJs}\n</script>`);
}

// ── HOOK SCENE ─────────────────────────────────────────────────────────────
function renderHookScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  bgImage: string | null,
): string {
  const bg = renderBackground(scene.visual.background, bgImage);
  const overlay = `<div class="overlay" style="opacity: 0.55"></div>`;
  const fx = (scene.visual.effects ?? []).map((e) => `<div class="fx ${e}"></div>`).join("");

  const lines = scene.visual.text.lines;
  const line0 = lines[0] ? `<div class="hook-line0">${escapeHtml(lines[0].content)}</div>` : "";
  const line1 = lines[1] ? `<div class="hook-line1">${escapeHtml(lines[1].content)}</div>` : "";

  const layout = `
<div class="layout-hook">
  <div class="badge">CÔNG NGHỆ 24h</div>
  ${line0}
  ${line1}
</div>`.trim();

  return buildScene(scene, start, duration, "hook", `${bg}\n  ${overlay}\n  ${layout}\n  ${fx}`);
}

// ── BODY SCENE ─────────────────────────────────────────────────────────────
function renderBodyScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  layoutIdx: number,
  bgImage: string | null,
): string {
  const fx = (scene.visual.effects ?? []).map((e) => `<div class="fx ${e}"></div>`).join("");

  let layoutHtml: string;
  let layoutName: string;

  const lines = scene.visual.text.lines;
  const l0 = lines[0] ? escapeHtml(lines[0].content) : "";
  const l1 = lines[1] ? escapeHtml(lines[1].content) : "";

  switch (layoutIdx) {
    case 0: {
      // Swiss: warm yellow background, bold black typography
      layoutName = "swiss";
      layoutHtml = `
<div class="layout-swiss">
  <div class="sw-flash fx color-flash-accent"></div>
  <div class="sw-line0">${l0}</div>
  <div class="sw-rule"></div>
  <div class="sw-line1">${l1}</div>
  <div class="sw-deco">
    <div class="sw-circle"></div>
    <div class="sw-square"></div>
  </div>
</div>`.trim();
      break;
    }
    case 1: {
      // Dark Card: dark gradient + white card with cyan accent
      layoutName = "dark-card";
      layoutHtml = `
<div class="layout-dark-card">
  <div class="dc-card">
    <div class="dc-line0">${l0}</div>
    <div class="dc-accent-line"></div>
    <div class="dc-line1">${l1}</div>
  </div>
</div>`.trim();
      break;
    }
    case 2: {
      // Split Cyan: top half cyan, bottom half black
      layoutName = "split-cyan";
      layoutHtml = `
<div class="layout-split-cyan">
  <div class="sc-top">
    <div class="sc-line0">${l0}</div>
  </div>
  <div class="sc-bottom">
    <div class="sc-line1">${l1}</div>
  </div>
  <div class="sc-divider"></div>
</div>`.trim();
      break;
    }
    case 3:
    default: {
      // Purple Hero: solid purple, giant white text with word stagger
      layoutName = "purple-hero";
      const words = l0.split(/\s+/).filter(Boolean);
      const wordSpans = words.map(w => `<div class="ph-word">${w}</div>`).join("\n    ");
      layoutHtml = `
<div class="layout-purple-hero">
  <div class="ph-tag">Công nghệ 24h</div>
  <div class="ph-words">
    ${wordSpans}
  </div>
  <div class="ph-line1-box">
    <div class="ph-line1">${l1}</div>
  </div>
</div>`.trim();
      break;
    }
  }

  return buildScene(scene, start, duration, layoutName, `${layoutHtml}\n  ${fx}`);
}

// ── OUTRO SCENE ────────────────────────────────────────────────────────────
function renderOutroScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  metadata: Script["metadata"],
): string {
  const lines = scene.visual.text.lines;
  // line[0] = "Xem bản tin mới mỗi ngày" → "Theo dõi" tag
  // line[1] = channel name
  // line[2] = source
  const tagText  = lines[0] ? escapeHtml(lines[0].content) : "Theo dõi";
  const channel  = escapeHtml(metadata.channel);
  const source   = lines[2] ? escapeHtml(lines[2].content) : `Nguồn: ${escapeHtml(metadata.source.domain)}`;

  const layout = `
<div class="layout-outro">
  <div class="out-tag">${tagText}</div>
  <div class="out-channel">${channel}</div>
  <div class="out-underline"></div>
  <div class="out-source">${source}</div>
</div>`.trim();

  return buildScene(scene, start, duration, "outro", layout);
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function buildScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  layoutName: string,
  innerHtml: string,
): string {
  return `
<div class="scene clip" id="scene-${scene.id}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-active="0"
     data-layout="${layoutName}">
  ${innerHtml}
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
    // Strip "-slow" suffix from kenBurns enum to match CSS class names
    const kbBase = bg.kenBurns.replace(/-slow$/, "");
    return `<div class="bg kb-${kbBase}" style="background-image: url('${imagePath}')"></div>`;
  } else {
    return `<div class="bg gradient-${bg.preset}"></div>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
