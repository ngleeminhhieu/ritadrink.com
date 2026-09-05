const MOBILE_BREAKPOINT = "(max-width: 600px)";
const TABLET_BREAKPOINT = "(max-width: 1200px)";
const AUTO_DELAY = 5000;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const initRange = (section) => {
  const row = section.querySelector(".range__row");
  if (!row || row.dataset.rangeReady === "true") return;

  row.dataset.rangeReady = "true";
  const originals = [...row.querySelectorAll(":scope > .range__item")];
  if (!originals.length) return;

  originals.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.classList.add("is-clone");
    clone.tabIndex = -1;
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("aria-controls");
    clone.querySelectorAll("img").forEach((image) => {
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
    });
    row.appendChild(clone);
  });

  const items = [...row.querySelectorAll(":scope > .range__item")];
  const mobileMedia = window.matchMedia(MOBILE_BREAKPOINT);
  const tabletMedia = window.matchMedia(TABLET_BREAKPOINT);
  const hoverMedia = window.matchMedia("(hover: hover)");
  const info = section.querySelector(".range__info");
  const infoCard = section.querySelector(".range__info-card");
  const infoCategory = section.querySelector(".range__info-cate");
  const infoName = section.querySelector(".range__info-name");
  let openItem = null;
  let isDragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let loopWidth = 0;
  let resizeTimer;
  let autoTimer;
  let autoIndex = 0;
  let suppressClickUntil = 0;

  const currentScale = () => (mobileMedia.matches ? 0.65 : 1);

  const imageSize = (image, dimension) => {
    if (!image) return 0;
    const natural = dimension === "width" ? image.naturalWidth : image.naturalHeight;
    return natural || Number.parseFloat(image.getAttribute(dimension)) || 0;
  };

  const sizeItem = (item) => {
    const release = item.querySelector(".range__release");
    const pack = item.querySelector(".range__pack");
    if (!release) return;

    const scale = currentScale();
    const releaseWidth = imageSize(release, "width") * scale;
    const releaseHeight = imageSize(release, "height") * scale;
    const packWidth = imageSize(pack, "width") * scale;
    const packHeight = imageSize(pack, "height") * scale;

    if (releaseWidth && releaseHeight) {
      item.dataset.releaseWidth = String(releaseWidth);
      item.style.width = `${releaseWidth}px`;
      item.style.height = `${releaseHeight}px`;
      release.style.width = `${releaseWidth}px`;
      release.style.height = `${releaseHeight}px`;
    }

    if (pack && packWidth && packHeight) {
      item.dataset.packWidth = String(packWidth);
      pack.style.width = `${packWidth}px`;
      pack.style.height = `${packHeight}px`;
    }

    if (item === openItem && packWidth) {
      item.style.width = `${packWidth}px`;
    }
  };

  const measureLoop = () => {
    const firstClone = items[originals.length];
    loopWidth = firstClone ? firstClone.offsetLeft - items[0].offsetLeft : 0;
  };

  const syncInfoPosition = () => {
    if (!info || !infoCard || !openItem) return;

    const pack = openItem.querySelector(".range__pack");
    const reference = pack?.getBoundingClientRect().width ? pack : openItem;
    const referenceRect = reference.getBoundingClientRect();
    const infoRect = info.getBoundingClientRect();
    const cardRect = infoCard.getBoundingClientRect();
    const edgeGap = mobileMedia.matches ? 16 : 32;
    const desiredLeft = referenceRect.left + (referenceRect.width / 2) - infoRect.left - (cardRect.width / 2);
    const maxLeft = Math.max(edgeGap, infoRect.width - cardRect.width - edgeGap);

    infoCard.style.left = `${clamp(desiredLeft, edgeGap, maxLeft)}px`;
  };

  const showInfo = (item) => {
    if (!infoCard || !item) return;

    if (infoCategory) infoCategory.textContent = item.dataset.cate || "";
    if (infoName) infoName.textContent = item.dataset.name || "";
    infoCard.classList.add("show");
    infoCard.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(syncInfoPosition);
  };

  const hideInfo = () => {
    infoCard?.classList.remove("show");
    infoCard?.setAttribute("aria-hidden", "true");
  };

  const setOpen = (target) => {
    openItem = target;

    items.forEach((item) => {
      const isOpen = item === target;
      const width = isOpen
        ? item.dataset.packWidth || item.dataset.releaseWidth
        : item.dataset.releaseWidth;

      item.classList.toggle("is-open", isOpen);
      item.setAttribute("aria-expanded", String(isOpen));
      if (width) item.style.width = `${width}px`;
    });

    if (target) showInfo(target);
    else hideInfo();
  };

  const centerItem = (item) => {
    const rowRect = row.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const offset = itemRect.left + (itemRect.width / 2) - rowRect.left - (rowRect.width / 2);
    row.scrollTo({
      left: row.scrollLeft + offset,
      behavior: "smooth",
    });
  };

  const stopAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = undefined;
  };

  const startAuto = () => {
    stopAuto();
    if (!tabletMedia.matches || !originals.length) return;

    const showNext = () => {
      const item = originals[autoIndex];
      setOpen(item);
      centerItem(item);
      autoIndex = (autoIndex + 1) % originals.length;
    };

    showNext();
    autoTimer = window.setInterval(showNext, AUTO_DELAY);
  };

  const handlePointerEnd = (event) => {
    if (!isDragging) return;
    isDragging = false;
    row.classList.remove("is-dragging");
    if (dragMoved) suppressClickUntil = performance.now() + 250;
    if (event?.pointerId !== undefined && row.hasPointerCapture?.(event.pointerId)) {
      row.releasePointerCapture(event.pointerId);
    }
  };

  row.addEventListener("dragstart", (event) => event.preventDefault());
  row.addEventListener("pointerdown", (event) => {
    stopAuto();
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    isDragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartScroll = row.scrollLeft;
    row.classList.add("is-dragging");
    row.setPointerCapture?.(event.pointerId);
  });
  row.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerType !== "mouse") return;
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) > 4) dragMoved = true;
    row.scrollLeft = dragStartScroll - delta;
  });
  row.addEventListener("pointerup", handlePointerEnd);
  row.addEventListener("pointercancel", handlePointerEnd);

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (!isDragging && hoverMedia.matches) setOpen(item);
    });
    item.addEventListener("focus", () => setOpen(item));
    item.addEventListener("click", (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        return;
      }
      stopAuto();
      setOpen(item);
      if (!hoverMedia.matches) centerItem(item);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setOpen(null);
      item.blur();
    });

    [item.querySelector(".range__release"), item.querySelector(".range__pack")]
      .filter(Boolean)
      .forEach((image) => image.addEventListener("load", () => {
        sizeItem(item);
        measureLoop();
      }, { once: true }));
  });

  section.addEventListener("mouseleave", () => {
    if (hoverMedia.matches && !section.contains(document.activeElement)) setOpen(null);
  });
  section.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!section.contains(document.activeElement)) setOpen(null);
    }, 0);
  });

  const refresh = () => {
    items.forEach(sizeItem);
    window.requestAnimationFrame(() => {
      measureLoop();
      syncInfoPosition();
    });
  };

  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      refresh();
      startAuto();
    }, 160);
  };

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("load", refresh, { once: true });
  tabletMedia.addEventListener?.("change", startAuto);

  refresh();
  startAuto();

  const tick = () => {
    if (loopWidth > 0) {
      if (row.scrollLeft >= loopWidth) {
        row.scrollLeft -= loopWidth;
        dragStartScroll -= loopWidth;
      } else if (row.scrollLeft <= 1 && isDragging) {
        row.scrollLeft += loopWidth;
        dragStartScroll += loopWidth;
      }
    }
    if (openItem) syncInfoPosition();
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
};

export default function RangeModule() {
  document.querySelectorAll(".range").forEach(initRange);
}
