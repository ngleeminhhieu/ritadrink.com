const DESKTOP_QUERY = "(min-width: 1201px)";

export default function HistoryModule() {
  const section = document.querySelector(".histTimelineJS");
  if (!section) return;

  const shots = [...section.querySelectorAll(".hist__shot")];
  const panels = [...section.querySelectorAll(".hist__panel")];
  const steps = [...section.querySelectorAll(".hist__bar-item")];
  const barList = section.querySelector(".hist__bar-list");
  const count = shots.length;
  if (!count) return;

  // Below 1201px the two wrappers flatten with display: contents, so order is
  // what interleaves each photo with the panel that belongs to it.
  shots.forEach((shot, index) => {
    shot.style.order = String(index * 2 + 1);
  });
  panels.forEach((panel, index) => {
    panel.style.order = String(index * 2 + 2);
  });

  const desktop = window.matchMedia(DESKTOP_QUERY);
  let active = 0;
  let frame = 0;

  const keepStepInView = (step) => {
    if (!barList || !step) return;

    const overflow = barList.scrollWidth - barList.clientWidth;
    if (overflow <= 1) return;

    const listBox = barList.getBoundingClientRect();
    const stepBox = step.getBoundingClientRect();
    const delta = stepBox.left + stepBox.width / 2 - (listBox.left + listBox.width / 2);
    if (Math.abs(delta) < 1) return;

    barList.scrollBy({ left: delta, behavior: "smooth" });
  };

  const setActive = (index) => {
    const next = Math.min(Math.max(index, 0), count - 1);
    if (next === active) return;

    active = next;
    shots.forEach((shot, i) => shot.classList.toggle("is-active", i === next));
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === next));
    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === next);
      step.setAttribute("aria-current", i === next ? "true" : "false");
    });

    keepStepInView(steps[next]);
  };

  // Pinned: the section is one viewport per milestone, so scroll progress maps
  // straight onto the index and every year owns an equal band.
  const pinnedIndex = () => {
    const span = section.offsetHeight - window.innerHeight;
    if (span <= 0) return 0;

    const progress = -section.getBoundingClientRect().top / span;
    return Math.round(Math.min(Math.max(progress, 0), 1) * (count - 1));
  };

  // Stacked: whichever photo sits closest to the reading line wins.
  const stackedIndex = () => {
    const line = window.innerHeight * 0.45;
    let best = 0;
    let bestGap = Infinity;

    shots.forEach((shot, index) => {
      const box = shot.getBoundingClientRect();
      const gap = Math.abs(box.top + box.height / 2 - line);
      if (gap < bestGap) {
        bestGap = gap;
        best = index;
      }
    });

    return best;
  };

  const update = () => {
    frame = 0;
    setActive(desktop.matches ? pinnedIndex() : stackedIndex());
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  const scrollToStep = (index) => {
    const top = section.getBoundingClientRect().top + window.scrollY;

    if (desktop.matches) {
      const span = Math.max(section.offsetHeight - window.innerHeight, 0);
      const ratio = count > 1 ? index / (count - 1) : 0;
      window.scrollTo({ top: Math.round(top + span * ratio), behavior: "smooth" });
      return;
    }

    const header = document.querySelector(".hd");
    const offset = header ? header.offsetHeight : 0;
    const shotTop = shots[index].getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.round(shotTop - offset), behavior: "smooth" });
  };

  steps.forEach((step, index) => {
    step.addEventListener("click", () => scrollToStep(index));
  });

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  desktop.addEventListener("change", requestUpdate);

  update();
}
