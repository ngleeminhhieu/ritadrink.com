const DRAG_THRESHOLD = 60;
const OUT = 460;
const BACK = 460;
const REVEAL_SCALE = 0.7;
const REVEAL_STEP = 380;

export default function StoryGalleryModule() {
  const section = document.querySelector(".storySliderJS");
  if (!section) return;

  const stage = section.querySelector(".storyStageJS");
  const cells = [...section.querySelectorAll(".story-strip__cell")];
  const photos = [...section.querySelectorAll(".story-photo")];
  const counter = section.querySelector(".storyCounterJS");
  const navButtons = [...section.querySelectorAll("[data-story-nav]")];
  if (!stage || !cells.length || photos.length < 2) return;

  const total = photos.length;
  const rtl = window.getComputedStyle(section).direction === "rtl";
  let activeIndex = Math.max(photos.findIndex((photo) => photo.classList.contains("is-active")), 0);
  let placeFrame = 0;
  let settleTimer = 0;
  let revealed = false;
  const timers = new Map();

  const gapOf = () =>
    window.getComputedStyle(section).getPropertyValue("--story-gap").trim();

  const measure = () => ({
    host: section.getBoundingClientRect(),
    stageBox: stage.getBoundingClientRect(),
    slots: cells.map((cell) => cell.getBoundingClientRect()),
  });

  // Ring order runs stage -> slot 0 -> slot 1 -> ... -> last slot, and back
  // round to the stage. Every step moves each photo one place along it.
  const ringOf = (index, active) => (index - active + total) % total;

  const boxAt = (position, { host, stageBox, slots }) => {
    const rect = position === 0 ? stageBox : slots[Math.min(position - 1, slots.length - 1)];

    return {
      left: rect.left - host.left,
      top: rect.top - host.top,
      width: rect.width,
      height: rect.height,
      pad: position === 0 ? "0px" : gapOf(),
    };
  };

  // Off the left edge at reduced scale: where a photo waits its turn to join
  // the queue.
  const queuedBox = ({ host, slots }) => {
    const slot = slots[0];
    const height = slot.height * REVEAL_SCALE;

    return {
      left: -slot.width,
      top: slot.top - host.top + (slot.height - height) / 2,
      width: slot.width * REVEAL_SCALE,
      height,
      pad: gapOf(),
    };
  };

  const setBox = (photo, box) => {
    photo.style.setProperty("--x", `${box.left}px`);
    photo.style.setProperty("--y", `${box.top}px`);
    photo.style.setProperty("--w", `${box.width}px`);
    photo.style.setProperty("--h", `${box.height}px`);
    photo.style.setProperty("--pad", box.pad);
  };

  const stopTimers = (photo) => {
    (timers.get(photo) || []).forEach((id) => window.clearTimeout(id));
    timers.set(photo, []);
  };

  // A photo that jumps the ends of the ring must not cut across the section.
  // It leaves through one edge at the size it had, is repositioned unseen, then
  // rides back in through the opposite edge at its new size.
  const route = (photo, from, to, width, exitRight) => {
    stopTimers(photo);

    photo.style.transitionDuration = `${OUT}ms`;
    setBox(photo, { ...from, left: exitRight ? width : -from.width });

    const enter = window.setTimeout(() => {
      photo.style.transitionDuration = "0ms";
      setBox(photo, { ...to, left: exitRight ? -to.width : width });
      void photo.offsetWidth;

      photo.style.transitionDuration = `${BACK}ms`;
      photo.style.setProperty("--x", `${to.left}px`);

      const settle = window.setTimeout(() => {
        photo.style.transitionDuration = "";
      }, BACK);
      timers.set(photo, [settle]);
    }, OUT);

    timers.set(photo, [enter]);
  };

  // Placing is only ever a change of custom properties: nothing re-flows, and a
  // click mid-flight simply retargets the transition already running.
  const place = (previous) => {
    const geometry = measure();

    // Take the shorter way round the ring; forward walks each photo towards the
    // stage, backward walks it away.
    const ahead = previous === undefined ? 0 : (activeIndex - previous + total) % total;
    const forward = ahead <= total - ahead;
    const steps = forward ? ahead : total - ahead;
    const exitRight = forward === rtl;

    photos.forEach((photo, index) => {
      const to = boxAt(ringOf(index, activeIndex), geometry);

      if (previous === undefined) {
        stopTimers(photo);
        photo.style.transitionDuration = "";
        setBox(photo, to);
        return;
      }

      // Only the photos that pass the seam between the last slot and the stage
      // take the long way; the rest just shift along.
      const was = ringOf(index, previous);
      const wraps = forward ? was < steps : was + steps >= total;

      if (!wraps) {
        setBox(photo, to);
        return;
      }

      route(photo, boxAt(was, geometry), to, geometry.host.width, exitRight);
    });
  };

  // The queue fills first in, first out: photo 0 enters the last slot, then on
  // every beat each photo shifts one slot along, so they all take a turn in
  // every slot and the head of the queue ends up on the stage.
  const applyPhase = (phase, duration) => {
    const geometry = measure();
    const waiting = queuedBox(geometry);

    photos.forEach((photo, index) => {
      const position = index + total - phase;
      photo.style.transitionDuration = `${duration}ms`;
      setBox(photo, position >= total ? waiting : boxAt(position, geometry));
    });
  };

  const runReveal = () => {
    let phase = 0;

    const beat = () => {
      phase += 1;
      applyPhase(phase, REVEAL_STEP);

      if (phase < total) {
        window.setTimeout(beat, REVEAL_STEP);
        return;
      }

      window.setTimeout(() => {
        revealed = true;
        photos.forEach((photo) => {
          photo.style.transitionDuration = "";
        });
      }, REVEAL_STEP);
    };

    window.setTimeout(beat, 60);
  };

  const requestPlace = () => {
    if (placeFrame) return;
    placeFrame = window.requestAnimationFrame(() => {
      placeFrame = 0;
      if (revealed) place();
      else applyPhase(0, 0);
    });
  };

  const goToSlide = (index) => {
    if (!revealed) return;

    const next = ((index % total) + total) % total;
    if (next === activeIndex) return;

    const previous = activeIndex;
    activeIndex = next;

    photos.forEach((photo, i) => {
      const active = i === next;
      photo.classList.toggle("is-active", active);
      photo.setAttribute("aria-current", active ? "true" : "false");
      // The one leaving the stage stays on top until it is clear of it.
      photo.style.zIndex = i === previous ? "3" : active ? "2" : "1";
    });

    place(previous);

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (counter) counter.textContent = String(activeIndex + 1);
    }, OUT + BACK);
  };

  // Arrows are placed visually, so the step depends on the rendered direction:
  // under RTL the left-hand arrow is the one that advances.
  navButtons.forEach((button) => {
    const forward = (button.dataset.storyNav === "left") === rtl;
    button.setAttribute("aria-label", forward ? "الشريحة التالية" : "الشريحة السابقة");
    button.addEventListener("click", () => goToSlide(activeIndex + (forward ? 1 : -1)));
  });

  photos.forEach((photo, index) => {
    photo.addEventListener("click", () => goToSlide(index));
  });

  // Dragging the stage reads the same way as the arrows: pull the photo towards
  // the side it would leave through and the next one follows it in.
  let dragFrom = null;

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".story-nav, .story-actions")) return;

    dragFrom = event.clientX;
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointerup", (event) => {
    if (dragFrom === null) return;

    const travelled = event.clientX - dragFrom;
    dragFrom = null;
    if (Math.abs(travelled) < DRAG_THRESHOLD) return;

    goToSlide(activeIndex + ((rtl ? travelled > 0 : travelled < 0) ? 1 : -1));
  });

  stage.addEventListener("pointercancel", () => {
    dragFrom = null;
  });

  window.addEventListener("resize", requestPlace, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(requestPlace).observe(section);

  section.classList.add("is-ready");
  applyPhase(0, 0);
  if (counter) counter.textContent = String(activeIndex + 1);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      runReveal();
    }, { threshold: 0.25 });

    observer.observe(section);
  } else {
    runReveal();
  }
}
