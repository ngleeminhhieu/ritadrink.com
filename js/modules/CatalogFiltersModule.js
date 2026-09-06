const CatalogFiltersModule = () => {
  document.querySelectorAll(".catalogFiltersToggleJS").forEach((toggle) => {
    const root = toggle.closest(".catalog-page");
    const panelId = toggle.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    if (!root || !panel) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 1200px)");
    const jquery = window.jQuery;
    let isOpen = false;
    let expandTimer;

    const finishExpansion = () => {
      if (isOpen) panel.classList.add("is-mobile-expanded");
    };

    panel.addEventListener("transitionend", (event) => {
      if (event.target === panel && event.propertyName === "grid-template-rows") {
        finishExpansion();
      }
    });

    const closeSelects = () => {
      panel.querySelectorAll(".select2CatalogJS").forEach((select) => {
        select.closest(".catalog-select")?.classList.remove("is-select2-open");

        if (jquery?.fn?.select2 && select.classList.contains("select2-hidden-accessible")) {
          jquery(select).select2("close");
        }
      });
    };

    const setOpen = (open, { restoreFocus = true } = {}) => {
      const nextOpen = mobile.matches && open;

      if (isOpen && !nextOpen) {
        closeSelects();
      }

      isOpen = nextOpen;
      window.clearTimeout(expandTimer);
      panel.classList.remove("is-mobile-expanded");
      panel.classList.toggle("is-mobile-open", isOpen);
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "إغلاق مرشحات المنتجات" : "فتح مرشحات المنتجات");

      if (isOpen) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          finishExpansion();
        } else {
          // Release the clipping after the accordion opens so Select2 can extend below it.
          expandTimer = window.setTimeout(finishExpansion, 400);
        }
      }

      if (mobile.matches) {
        panel.setAttribute("aria-hidden", String(!isOpen));
        panel.inert = !isOpen;
        toggle.removeAttribute("aria-hidden");
        toggle.removeAttribute("tabindex");
      } else {
        panel.removeAttribute("aria-hidden");
        panel.inert = false;
        toggle.setAttribute("aria-hidden", "true");
        toggle.setAttribute("tabindex", "-1");
      }

      if (!isOpen && restoreFocus && mobile.matches && toggle.isConnected) {
        window.setTimeout(() => toggle.focus({ preventScroll: true }), 0);
      }
    };

    const openPanel = () => {
      if (!mobile.matches || isOpen) {
        return;
      }

      document.dispatchEvent(new CustomEvent("panel:open", { detail: "catalog-filter" }));
      setOpen(true);
    };

    const closePanel = (options) => {
      if (!isOpen) {
        return;
      }

      setOpen(false, options);
    };

    const syncMode = () => {
      setOpen(false, { restoreFocus: false });
      root.classList.add("is-catalog-filter-ready");
    };

    toggle.addEventListener("click", () => {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener("panel:open", (event) => {
      if (event.detail !== "catalog-filter") {
        closePanel({ restoreFocus: false });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen) {
        return;
      }

      if (event.key === "Escape") {
        const openSelect = panel.querySelector(".catalog-select.is-select2-open .select2CatalogJS");

        if (openSelect && jquery?.fn?.select2) {
          event.preventDefault();
          jquery(openSelect).select2("close");
          return;
        }

        event.preventDefault();
        closePanel();
        return;
      }
    });

    mobile.addEventListener("change", syncMode);
    syncMode();
  });
};

export default CatalogFiltersModule;
