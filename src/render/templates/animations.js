// Kinetic Typography Animation Engine
// Drives scene + element animations using GSAP timeline registered on window.__timelines.
//
// HyperFrames runtime drives playback by seeking the timeline at each frame.
// IMPORTANT: Only use supported GSAP properties: opacity, x, y, scale, scaleX, scaleY, rotation, width, height, visibility.
// Do NOT use `delay:` in vars — use position parameter (3rd arg) instead.
// Do NOT use `attr:` settings.
// Use simple easings only — defaults if unsure.

window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["news-video"] = tl;

(function () {
  const stage = document.getElementById("stage");
  const scenes = Array.from(stage.querySelectorAll(".scene"));

  // ── helpers ────────────────────────────────────────────────
  function staggerWords(container, tl, at, opts) {
    // Split container's text into word spans, then stagger them.
    // opts: { fromVars, toVars, staggerDelay }
    const text = container.textContent || "";
    const words = text.split(/\s+/).filter(Boolean);
    container.innerHTML = words.map(w => `<span class="word-span">${w}</span>`).join(" ");
    const spans = container.querySelectorAll(".word-span");
    const stagger = opts.staggerDelay || 0.1;
    spans.forEach((span, i) => {
      tl.fromTo(span, opts.fromVars, { ...opts.toVars, opacity: 1 }, at + i * stagger);
    });
  }

  // ── scene dispatch ─────────────────────────────────────────
  scenes.forEach((scene) => {
    const start = parseFloat(scene.dataset.start);
    const dur   = parseFloat(scene.dataset.duration);

    // Scene visibility
    tl.set(scene, { opacity: 1 }, start);
    tl.set(scene, { opacity: 0 }, start + dur);

    // Layout-specific entrance animations
    const layout = scene.dataset.layout;

    if (layout === "hook") {
      animateHook(scene, tl, start);
    } else if (layout === "swiss") {
      animateSwiss(scene, tl, start);
    } else if (layout === "dark-card") {
      animateDarkCard(scene, tl, start);
    } else if (layout === "split-cyan") {
      animateSplitCyan(scene, tl, start);
    } else if (layout === "purple-hero") {
      animatePurpleHero(scene, tl, start);
    } else if (layout === "outro") {
      animateOutro(scene, tl, start);
    } else {
      // Legacy fallback: animate .line elements
      animateLegacyLines(scene, tl, start);
    }

    // FX overlays (shared across all layouts)
    scene.querySelectorAll(".fx.flash-white-3f").forEach((el) => {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.05 }, start);
      tl.to(el,    { opacity: 0, duration: 0.05 }, start + 0.1);
    });
    scene.querySelectorAll(".fx.particle-burst").forEach((el) => {
      tl.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 0.9, scale: 1.4, duration: 0.4 }, start);
      tl.to(el,    { opacity: 0, duration: 0.3 }, start + 0.4);
    });
    scene.querySelectorAll(".fx.color-flash-accent").forEach((el) => {
      tl.fromTo(el, { opacity: 0 }, { opacity: 0.6, duration: 0.1 }, start);
      tl.to(el,    { opacity: 0, duration: 0.4 }, start + 0.1);
    });
  });

  // ── HOOK layout ────────────────────────────────────────────
  function animateHook(scene, tl, start) {
    // Badge: fade in immediately
    const badge = scene.querySelector(".badge");
    if (badge) {
      tl.fromTo(badge, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 }, start + 0.1);
    }

    // line0: massive scale-pop
    const line0 = scene.querySelector(".hook-line0");
    if (line0) {
      tl.fromTo(line0, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55 }, start + 0.2);
    }

    // line1: yellow accent, slide up after line0
    const line1 = scene.querySelector(".hook-line1");
    if (line1) {
      tl.fromTo(line1, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, start + 0.6);
    }
  }

  // ── SWISS layout ───────────────────────────────────────────
  function animateSwiss(scene, tl, start) {
    // White flash at scene start
    tl.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 0.05 }, start);
    // Quick white overlay then settle
    const flashOverlay = scene.querySelector(".sw-flash");
    if (flashOverlay) {
      tl.fromTo(flashOverlay, { opacity: 0.8 }, { opacity: 0, duration: 0.1 }, start + 0.05);
    }

    // line0: slide in from left, word-by-word stagger
    const line0 = scene.querySelector(".sw-line0");
    if (line0) {
      staggerWords(line0, tl, start + 0.1, {
        fromVars: { x: -80, opacity: 0 },
        toVars:   { x: 0, duration: 0.4 },
        staggerDelay: 0.12,
      });
    }

    // Horizontal rule: expand from left
    const rule = scene.querySelector(".sw-rule");
    if (rule) {
      tl.fromTo(rule, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.4 }, start + 0.55);
    }

    // line1: fade in
    const line1 = scene.querySelector(".sw-line1");
    if (line1) {
      tl.fromTo(line1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, start + 0.85);
    }

    // Deco: fade in last
    const deco = scene.querySelector(".sw-deco");
    if (deco) {
      tl.fromTo(deco, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, start + 1.1);
    }
  }

  // ── DARK CARD layout ───────────────────────────────────────
  function animateDarkCard(scene, tl, start) {
    // Card slides up + scales in
    const card = scene.querySelector(".dc-card");
    if (card) {
      tl.fromTo(card, { y: 80, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55 }, start + 0.15);
    }

    // line0: scale up inside card
    const line0 = scene.querySelector(".dc-line0");
    if (line0) {
      tl.fromTo(line0, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45 }, start + 0.45);
    }

    // Cyan accent line: expand from left
    const accentLine = scene.querySelector(".dc-accent-line");
    if (accentLine) {
      tl.fromTo(accentLine, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.4 }, start + 0.75);
      accentLine.style.transformOrigin = "left center";
    }

    // line1: slide up
    const line1 = scene.querySelector(".dc-line1");
    if (line1) {
      tl.fromTo(line1, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, start + 1.0);
    }
  }

  // ── SPLIT CYAN layout ──────────────────────────────────────
  function animateSplitCyan(scene, tl, start) {
    // Top cyan half slides down from above
    const top = scene.querySelector(".sc-top");
    if (top) {
      tl.fromTo(top, { y: -top.offsetHeight || -960, opacity: 1 }, { y: 0, opacity: 1, duration: 0.5 }, start + 0.1);
    }

    // Bottom black half slides up from below
    const bottom = scene.querySelector(".sc-bottom");
    if (bottom) {
      tl.fromTo(bottom, { y: bottom.offsetHeight || 960, opacity: 1 }, { y: 0, opacity: 1, duration: 0.5 }, start + 0.1);
    }

    // Divider line: fade in after halves settle
    const divider = scene.querySelector(".sc-divider");
    if (divider) {
      tl.fromTo(divider, { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.3 }, start + 0.45);
    }

    // line0: slide from left (on cyan top)
    const line0 = scene.querySelector(".sc-line0");
    if (line0) {
      tl.fromTo(line0, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45 }, start + 0.5);
    }

    // line1: slide from right (on black bottom)
    const line1 = scene.querySelector(".sc-line1");
    if (line1) {
      tl.fromTo(line1, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45 }, start + 0.65);
    }
  }

  // ── PURPLE HERO layout ─────────────────────────────────────
  function animatePurpleHero(scene, tl, start) {
    // Top-right tag: fade in
    const tag = scene.querySelector(".ph-tag");
    if (tag) {
      tl.fromTo(tag, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.35 }, start + 0.1);
    }

    // Words stagger (line0 split into .ph-word spans)
    const words = scene.querySelectorAll(".ph-word");
    words.forEach((word, i) => {
      tl.fromTo(word, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, start + 0.2 + i * 0.1);
    });

    // line1 box: scale + fade in
    const line1box = scene.querySelector(".ph-line1-box");
    if (line1box) {
      tl.fromTo(line1box, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 }, start + 0.6);
    }
  }

  // ── OUTRO layout ───────────────────────────────────────────
  function animateOutro(scene, tl, start) {
    // "Theo dõi" tag fades in first
    const tag = scene.querySelector(".out-tag");
    if (tag) {
      tl.fromTo(tag, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.45 }, start + 0.2);
    }

    // Channel name: scale pop
    const channel = scene.querySelector(".out-channel");
    if (channel) {
      tl.fromTo(channel, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55 }, start + 0.55);
    }

    // Underline expands from center
    const underline = scene.querySelector(".out-underline");
    if (underline) {
      tl.fromTo(underline, { width: 0, opacity: 1 }, { width: "600px", opacity: 1, duration: 0.5 }, start + 0.9);
    }

    // Source line fades in last
    const source = scene.querySelector(".out-source");
    if (source) {
      tl.fromTo(source, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, start + 1.3);
    }
  }

  // ── LEGACY LINE fallback ───────────────────────────────────
  function animateLegacyLines(scene, tl, start) {
    const lines = scene.querySelectorAll(".line");
    lines.forEach((line, idx) => {
      const anim = line.dataset.animation;
      const at = start + 0.15 + idx * 0.25;

      switch (anim) {
        case "scale-pop":
          tl.fromTo(line, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 }, at);
          break;
        case "slide-up":
          tl.fromTo(line, { y: 80,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, at);
          break;
        case "slide-up-bounce":
          tl.fromTo(line, { y: 80,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, at);
          break;
        case "slide-down":
          tl.fromTo(line, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, at);
          break;
        case "slide-left":
          tl.fromTo(line, { x: 80,  opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, at);
          break;
        case "slide-right":
          tl.fromTo(line, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, at);
          break;
        case "fade-in-late":
          tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.6 }, at + 0.4);
          break;
        case "typewriter":
          tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.05 }, at);
          break;
        case "fade-in":
        default:
          tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.5 }, at);
      }
    });
  }
})();
