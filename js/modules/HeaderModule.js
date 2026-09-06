export default function HeaderModule() {
  const header = document.querySelector(".hd");
  if (!header) return;

  const topbar = header.querySelector(".hd-top");
  const main = document.querySelector(".main");
  const megaItems = [...header.querySelectorAll(".menu-item.mega[data-mega]")];
  const megaContainer = header.querySelector(".hd-mega");
  const overlay = header.querySelector(".hd-overlay");
  const desktop = window.matchMedia("(min-width: 1201px)");
  const getScrollY = () => Math.max(0, Math.min(
    window.scrollY,
    document.documentElement.scrollHeight - window.innerHeight,
  ));
  let lastScrollY = getScrollY();
  let megaOpen = false;
  let megaCloseTimer;
  let keyboardNavigation = false;

  const setVisibility = (hidden, atTop = !header.classList.contains("hd-top-hide")) => {
    const changed = header.classList.contains("hd-scroll-hide") !== hidden
      || header.classList.contains("hd-top-hide") === atTop;
    header.classList.toggle("hd-scroll-hide", hidden);
    header.classList.toggle("hd-top-hide", !atTop);
    topbar?.toggleAttribute("inert", !atTop);
    topbar?.setAttribute("aria-hidden", String(!atTop));

    if (changed) document.dispatchEvent(new CustomEvent("header:visibilitychange"));
  };

  const updateTransparent = () => {
    const transparent = desktop.matches
      && window.scrollY <= 0
      && !megaOpen
      && !header.hasAttribute("data-header-action")
      && !header.classList.contains("default");
    header.classList.toggle("hd-transparent", transparent);
  };

  const closeMega = () => {
    window.clearTimeout(megaCloseTimer);
    megaOpen = false;
    header.removeAttribute("data-active-mega");
    updateTransparent();
  };

  const openMega = (key) => {
    if (!desktop.matches) return;
    document.dispatchEvent(new CustomEvent("panel:open", { detail: "header-mega" }));
    window.clearTimeout(megaCloseTimer);
    megaOpen = true;
    header.dataset.activeMega = key;
    updateTransparent();
  };

  const scheduleCloseMega = () => {
    window.clearTimeout(megaCloseTimer);
    megaCloseTimer = window.setTimeout(() => {
      if (megaContainer?.matches(":hover") || megaContainer?.contains(document.activeElement)) return;
      closeMega();
    }, 120);
  };

  const updateHeader = () => {
    if (document.body.style.position === "fixed") return;

    const scrollY = getScrollY();
    const delta = scrollY - lastScrollY;
    const scrolled = scrollY > 0;
    const atTop = scrollY <= 0;
    const interacting = megaOpen
      || header.hasAttribute("data-header-action")
      || document.querySelector(".mobile.open")
      || (keyboardNavigation && header.contains(document.activeElement));

    document.body.classList.toggle("sticky", scrolled);
    main?.classList.toggle("hd-sticky", scrolled);
    updateTransparent();

    if (atTop) {
      setVisibility(false, true);
    } else if (interacting) {
      setVisibility(false, false);
    } else if (Math.abs(delta) >= 4) {
      setVisibility(delta > 0, false);
    } else {
      setVisibility(header.classList.contains("hd-scroll-hide"), false);
      return;
    }

    lastScrollY = scrollY;
  };

  megaItems.forEach((item) => {
    item.addEventListener("mouseenter", () => openMega(item.dataset.mega));
    item.addEventListener("mouseleave", scheduleCloseMega);
    item.addEventListener("focusin", () => openMega(item.dataset.mega));
    item.addEventListener("focusout", scheduleCloseMega);
  });

  megaContainer?.addEventListener("mouseenter", () => window.clearTimeout(megaCloseTimer));
  megaContainer?.addEventListener("mouseleave", scheduleCloseMega);
  megaContainer?.addEventListener("focusin", () => window.clearTimeout(megaCloseTimer));
  megaContainer?.addEventListener("focusout", scheduleCloseMega);
  overlay?.addEventListener("click", closeMega);

  document.addEventListener("panel:open", (event) => {
    if (event.detail !== "header-mega") closeMega();
    if (["header-mega", "header-action", "mobile-menu"].includes(event.detail)) {
      setVisibility(false);
    }
  });

  document.addEventListener("header-action:change", () => {
    updateTransparent();
    updateHeader();
  });
  header.addEventListener("focusin", () => setVisibility(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") keyboardNavigation = true;
    if (event.key === "Escape") closeMega();
  });
  document.addEventListener("pointerdown", () => { keyboardNavigation = false; }, { passive: true });
  window.addEventListener("wheel", () => { keyboardNavigation = false; }, { passive: true });

  desktop.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMega();
      return;
    }

    updateTransparent();
  });

  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("pageshow", () => {
    lastScrollY = getScrollY();
    updateHeader();
  });
  window.addEventListener("resize", () => {
    lastScrollY = getScrollY();
    updateHeader();
  });
  updateHeader();
}
