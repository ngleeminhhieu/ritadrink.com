export default function HeaderModule() {
  const header = document.querySelector(".hd");
  if (!header) return;

  const main = document.querySelector(".main");
  const megaItems = [...header.querySelectorAll(".menu-item.mega[data-mega]")];
  const megaContainer = header.querySelector(".hd-mega");
  const overlay = header.querySelector(".hd-overlay");
  const desktop = window.matchMedia("(min-width: 1201px)");
  let lastScrollY = window.scrollY;
  let megaOpen = false;
  let megaCloseTimer;

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

    const scrollY = window.scrollY;
    const scrollingUp = scrollY < lastScrollY;
    const scrolled = scrollY > 0;

    document.body.classList.toggle("sticky", scrolled);
    main?.classList.toggle("hd-sticky", scrolled);
    updateTransparent();

    if (!scrolled || scrollingUp) {
      header.classList.remove("hd-top-hide");
    } else {
      header.classList.add("hd-top-hide");
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
  });

  document.addEventListener("header-action:change", updateTransparent);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMega();
  });

  desktop.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMega();
      return;
    }

    updateTransparent();
  });

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}
