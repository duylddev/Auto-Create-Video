// Drives scene activation + line animations using GSAP.
// Reads data attrs from #stage and each .scene element.
//
// HyperFrames integration notes:
//   - Timeline is registered on window.__timelines["news-video"] so the renderer
//     can seek/play it during headless capture.
//   - All .scene elements act as clips: visibility is controlled via data-active
//     attribute (CSS: .scene[data-active="1"] { opacity: 1 }).
//   - The composition root has data-composition-id="news-video" (matches timeline key).
//
// Intentionally NOT implemented: "screen-shake-light" effect (spec §7.4).
//   The schema enum allows it but the renderer silently ignores unknown effects.
//   This is an accepted MVP limitation — add a CSSAnimation + gsap.to() here
//   to implement it in a future iteration.

(function () {
  const stage = document.getElementById("stage");
  const totalDuration = parseFloat(stage.dataset.duration);
  const scenes = Array.from(stage.querySelectorAll(".scene"));

  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  window.__timelines["news-video"] = tl;

  scenes.forEach((scene) => {
    const start = parseFloat(scene.dataset.start);
    const dur = parseFloat(scene.dataset.duration);
    scene.style.setProperty("--scene-dur", dur + "s");

    tl.set(scene, { attr: { "data-active": "1" } }, start);
    tl.set(scene, { attr: { "data-active": "0" } }, start + dur);

    // Line text animations (per spec §7.3)
    const lines = scene.querySelectorAll(".line");
    lines.forEach((line, idx) => {
      const anim = line.dataset.animation;
      const delay = start + 0.15 + idx * 0.25;
      const map = {
        "scale-pop":         { from: { scale: 0.4, opacity: 0 }, to: { scale: 1, opacity: 1, ease: "back.out(2)", duration: 0.5 } },
        "slide-up":          { from: { y: 80,  opacity: 0 }, to: { y: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-up-bounce":   { from: { y: 80,  opacity: 0 }, to: { y: 0, opacity: 1, ease: "elastic.out(1,0.5)", duration: 0.8 } },
        "slide-down":        { from: { y: -80, opacity: 0 }, to: { y: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-left":        { from: { x: 80,  opacity: 0 }, to: { x: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-right":       { from: { x: -80, opacity: 0 }, to: { x: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "fade-in":           { from: { opacity: 0 }, to: { opacity: 1, duration: 0.5 } },
        "fade-in-late":      { from: { opacity: 0 }, to: { opacity: 1, delay: 0.4, duration: 0.6 } },
        "typewriter":        { from: { opacity: 0 }, to: { opacity: 1, duration: 0.05 } }, // simplified
      };
      const cfg = map[anim] || map["fade-in"];
      tl.fromTo(line, cfg.from, { ...cfg.to, immediateRender: false }, delay);
    });

    // Effects
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

  // Sync timeline with audio
  const audio = stage.querySelector("audio");
  if (audio) {
    audio.addEventListener("play",   () => tl.play(audio.currentTime));
    audio.addEventListener("pause",  () => tl.pause());
    audio.addEventListener("seeked", () => tl.seek(audio.currentTime));
  }

  // Auto-start on load.
  // HyperFrames headless render drives playback via window.__timelines directly.
  // The audio.play() call is a fallback for browser preview mode; autoplay may be
  // blocked in non-headless browsers — that is expected and safe to ignore.
  window.addEventListener("load", () => {
    if (audio) {
      audio.play().catch(() => {/* autoplay blocked in browser preview — harmless */});
    }
    tl.play();
  });
})();
