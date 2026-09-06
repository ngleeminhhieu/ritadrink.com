const ProductCategoriesModule = () => {
  document.querySelectorAll(".productCategoriesJS").forEach((root) => {
    const toggle = root.querySelector(".productCategoriesToggleJS");
    const panel = root.querySelector(".productCategoriesPanelJS");
    const sticky = root.querySelector(".product-categories__sticky");
    const panelInner = root.querySelector(".product-categories__panel-inner");

    if (!toggle || !panel) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 1200px)");
    const desktop = window.matchMedia("(min-width: 1201px)");
    let stickyFrame;
    let stickyTimer;

    const syncStickyPanelHeight = () => {
      if (!desktop.matches || !sticky || !panelInner) {
        root.style.removeProperty("--product-categories-panel-height");
        return;
      }

      const headerBottom = Math.max(0, document.querySelector(".hd")?.getBoundingClientRect().bottom || 0);
      const headRect = toggle.parentElement?.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const isHeadPinned = headRect && headRect.top <= headerBottom + 1 && headRect.bottom > headerBottom;

      if (!isHeadPinned) {
        root.style.removeProperty("--product-categories-panel-height");
        return;
      }

      const availableHeight = Math.max(0, Math.floor(Math.min(window.innerHeight, stickyRect.bottom) - headRect.bottom));
      const contentHeight = panelInner.scrollHeight;

      if (availableHeight < contentHeight) {
        root.style.setProperty("--product-categories-panel-height", `${availableHeight}px`);
      } else {
        root.style.removeProperty("--product-categories-panel-height");
      }
    };

    const scheduleStickyPanelHeight = () => {
      window.cancelAnimationFrame(stickyFrame);
      window.clearTimeout(stickyTimer);
      stickyFrame = window.requestAnimationFrame(() => {
        syncStickyPanelHeight();
        stickyTimer = window.setTimeout(syncStickyPanelHeight, 400);
      });
    };

    const setOpen = (open) => {
      root.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
    };

    const syncDefaultState = () => {
      setOpen(!mobile.matches);
      scheduleStickyPanelHeight();
    };

    syncDefaultState();

    toggle.addEventListener("click", () => {
      const nextOpen = !root.classList.contains("is-open");

      if (nextOpen && mobile.matches) {
        document.dispatchEvent(new CustomEvent("panel:open", { detail: "product-categories" }));
      }

      setOpen(nextOpen);
    });

    document.addEventListener("panel:open", (event) => {
      if (mobile.matches && event.detail !== "product-categories") {
        setOpen(false);
      }
    });

    mobile.addEventListener("change", syncDefaultState);
    desktop.addEventListener("change", syncDefaultState);
    window.addEventListener("scroll", scheduleStickyPanelHeight, { passive: true });
    window.addEventListener("resize", scheduleStickyPanelHeight);
    document.addEventListener("header:visibilitychange", scheduleStickyPanelHeight);
  });
};

export default ProductCategoriesModule;
