import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { composeHtml } from "./html-composer.js";
import type { Script } from "./script-schema.js";

describe("composeHtml", () => {
  it("produces deterministic HTML for sample script with image", () => {
    const script = JSON.parse(readFileSync("tests/fixtures/sample-script-with-image.json", "utf8")) as Script;
    const sceneAudio = [
      { id: "hook",   durationSec: 3.2 },
      { id: "body-1", durationSec: 11.5 },
      { id: "body-2", durationSec: 10.8 },
      { id: "body-3", durationSec: 12.1 },
      { id: "outro",  durationSec: 3.4 },
    ];
    const html = composeHtml({
      script,
      sceneAudio,
      gapSec: 0.3,
      bgImageRelPath: "images/bg.jpg",
      audioRelPath: "voice.mp3",
    });

    // ── HyperFrames structural requirements ──────────────────
    expect(html).toContain('id="stage"');
    expect(html).toContain('data-composition-id="news-video"');
    expect(html).toContain('data-width="1080"');
    expect(html).toContain('data-height="1920"');
    expect(html).toContain('data-start="0"');           // root composition timing
    expect(html).toContain('id="voice"');               // audio element discoverable by hyperframes
    expect(html).toContain('class="scene clip"');       // clip class required for hyperframes visibility
    expect(html).toContain('window.__timelines');       // timeline registry (inlined JS)

    // ── Image background (hook scene uses og:image) ──────────
    expect(html).toContain('class="bg kb-zoom-in"');
    expect(html).toContain("background-image: url('images/bg.jpg')");

    // ── Kinetic typography layouts ───────────────────────────
    // Hook scene: layout-hook with massive title lines
    expect(html).toContain('data-layout="hook"');
    expect(html).toContain('class="hook-line0"');
    expect(html).toContain("iPhone 17");                // hook line0 content
    expect(html).toContain('class="hook-line1"');
    expect(html).toContain("Camera 200MP!");            // hook line1 content
    expect(html).toContain('class="badge"');

    // Body scenes: 4 layouts cycling
    expect(html).toContain('data-layout="swiss"');      // layout 0: body-1
    expect(html).toContain('class="sw-line0"');
    expect(html).toContain('class="sw-rule"');
    expect(html).toContain('class="sw-line1"');

    expect(html).toContain('data-layout="dark-card"');  // layout 1: body-2
    expect(html).toContain('class="dc-card"');
    expect(html).toContain('class="dc-line0"');
    expect(html).toContain('class="dc-accent-line"');

    // Fixture has 3 body scenes → layouts: swiss (0), dark-card (1), split-cyan (2)
    expect(html).toContain('data-layout="split-cyan"');   // layout 2: body-3

    // Outro scene: kinetic outro layout
    expect(html).toContain('data-layout="outro"');
    expect(html).toContain('class="out-channel"');
    expect(html).toContain('class="out-underline"');
    expect(html).toContain('class="out-source"');
    expect(html).toContain("Công nghệ 24h");            // channel name in outro

    // Outro line content (from fixture scene[outro].lines[0])
    expect(html).toContain("Xem bản tin mới mỗi ngày");

    // Audio src
    expect(html).toContain('src="voice.mp3"');
    expect(html).toMatch(/data-duration="[\d.]+"/);

    // Google Fonts present
    expect(html).toContain("fonts.googleapis.com");
  });

  it("falls back to gradient when bgImageRelPath is null but type=image", () => {
    const script = JSON.parse(readFileSync("tests/fixtures/sample-script-with-image.json", "utf8")) as Script;
    const sceneAudio = script.scenes.map((s) => ({ id: s.id, durationSec: 5 }));
    const html = composeHtml({
      script,
      sceneAudio,
      gapSec: 0.3,
      bgImageRelPath: null,
      audioRelPath: "voice.mp3",
    });
    expect(html).toContain('class="bg gradient-news-dark"');  // fallback preset
    expect(html).not.toContain("background-image: url");
  });
});
