const DEFAULT_DURATION = 1400;

export default function CountUpModule() {
  const counters = [...document.querySelectorAll("[data-count]")];
  if (!counters.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getParts = (counter) => {
    const stat = counter.closest(".sec-intro__stat");
    return {
      unit: counter.parentElement?.querySelector(".sec-intro__unit"),
      label: stat?.querySelector(".sec-intro__label"),
    };
  };

  const hidePart = (element) => {
    if (!element) return;
    element.style.opacity = "0";
    element.style.transform = "translateY(0.35em)";
    element.style.transition = "opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 1.1, 0.4, 1)";
  };

  const showPart = (element) => {
    if (!element) return;
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";
  };

  const setFinalValue = (counter) => {
    const target = Number(counter.dataset.count) || 0;
    const { unit, label } = getParts(counter);
    counter.textContent = String(target);
    showPart(label);
    showPart(unit);
  };

  const animate = (counter) => {
    const target = Number(counter.dataset.count) || 0;
    const duration = Number(counter.dataset.countDur) || DEFAULT_DURATION;
    const { unit, label } = getParts(counter);
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      counter.textContent = String(Math.round(target * easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      showPart(label);
      window.setTimeout(() => showPart(unit), 150);
    };

    window.requestAnimationFrame(tick);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(setFinalValue);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  counters.forEach((counter) => {
    const { unit, label } = getParts(counter);
    counter.textContent = "0";
    hidePart(unit);
    hidePart(label);
    observer.observe(counter);
  });
}
