// Drives scene + line + effect animations using GSAP timeline pre-registered on window.__timelines.
//
// HyperFrames runtime drives playback by seeking the timeline at each frame.
// IMPORTANT: Only use supported GSAP properties: opacity, x, y, scale, scaleX, scaleY, rotation, width, height, visibility.
// Do NOT use `delay:` in vars (use position parameter — 3rd arg — instead).
// Do NOT use `attr:` setting.
// Use simple easings only — defaults if unsure.

(function () {
  const stage = document.getElementById("stage");
  const tl = window.__timelines["news-video"];
  if (!tl) {
    console.error("[animations.js] Timeline 'news-video' not registered before this script runs!");
    return;
  }

  const scenes = Array.from(stage.querySelectorAll(".scene"));

  scenes.forEach((scene) => {
    const start = parseFloat(scene.dataset.start);
    const dur = parseFloat(scene.dataset.duration);

    // Scene visibility — explicit opacity tweens (HyperFrames .clip ALSO manages display, but
    // explicit opacity is more reliable and gives smoother transitions).
    tl.set(scene, { opacity: 1 }, start);
    tl.set(scene, { opacity: 0 }, start + dur);

    // Line text animations
    const lines = scene.querySelectorAll(".line");
    lines.forEach((line, idx) => {
      const anim = line.dataset.animation;
      const at = start + 0.15 + idx * 0.25;  // position param, NOT delay

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
          // No "delay:" — schedule the tween 0.4s later via position param
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
})();
