export default function MilestoneModule() {
  const track = document.querySelector(".mileTrackJS");
  if (!track) return;

  const section = track.closest(".sec-mile");
  const pin = track.parentElement;
  if (!section || !pin) return;

  const desktop = window.matchMedia("(min-width: 1201px)");
  let frame = 0;

  // Vertical scroll through the tall section maps onto the track's overhang, so
  // the last card lands exactly as the section releases.
  const update = () => {
    frame = 0;

    // Unpinned, the track scrolls itself, so progress comes from its own offset
    // and still drives the map sweep and the bar. RTL scrollLeft counts down
    // from 0 to -max in Chrome, hence the magnitude.
    if (!desktop.matches) {
      section.style.removeProperty("--mile-x");

      const reach = track.scrollWidth - track.clientWidth;
      const ratio = reach > 0 ? Math.min(Math.abs(track.scrollLeft) / reach, 1) : 0;
      section.style.setProperty("--mile-progress", ratio.toFixed(4));
      return;
    }

    section.style.setProperty("--mile-view", `${pin.clientWidth}px`);

    const travel = track.scrollWidth - pin.clientWidth;
    const span = section.offsetHeight - window.innerHeight;
    if (travel <= 0 || span <= 0) {
      section.style.setProperty("--mile-x", "0px");
      return;
    }

    const progress = Math.min(Math.max(-section.getBoundingClientRect().top / span, 0), 1);
    section.style.setProperty("--mile-progress", progress.toFixed(4));
    section.style.setProperty("--mile-x", `${Math.round(progress * travel)}px`);
  };

  const request = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  track.addEventListener("scroll", request, { passive: true });
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  desktop.addEventListener("change", request);

  update();
}
