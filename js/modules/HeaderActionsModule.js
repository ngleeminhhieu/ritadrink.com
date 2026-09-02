export default function HeaderActionsModule() {
  const header = document.querySelector(".hd");
  if (!header) return;

  const actions = new Set(["search", "contact", "catalogue"]);
  const triggers = [...header.querySelectorAll("[data-header-action-open]")];
  const panels = [...header.querySelectorAll("[data-header-action-panel]")];
  const actionbar = header.querySelector(".hd-actionbar");
  const closeButton = header.querySelector(".headerActionCloseJS");
  const overlay = header.querySelector(".hd-overlay");
  const headerSelects = [...header.querySelectorAll(".select2HeaderJS")];
  const contactSelects = [...header.querySelectorAll(".select2ContactJS")];
  const managedSelects = [...headerSelects, ...contactSelects];
  const contactForm = header.querySelector(".hd-contact__form");
  const jquery = window.jQuery;
  let activeAction = "";
  let activeOpener = null;
  let lockedScrollY = 0;
  let bodyStyles = null;

  const closeSelects = () => {
    managedSelects.forEach((select) => {
      select.closest(".hd-filter, .hd-contact__select-wrap")?.classList.remove("is-select2-open");
      select.closest(".hd-contact__field")?.classList.remove("is-select2-field-open");
      if (jquery?.fn?.select2 && select.classList.contains("select2-hidden-accessible")) {
        jquery(select).select2("close");
      }
    });
  };

  const lockScroll = () => {
    if (bodyStyles) return;

    lockedScrollY = window.scrollY;
    bodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      right: document.body.style.right,
      left: document.body.style.left,
      width: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.right = "0";
    document.body.style.left = "0";
    document.body.style.width = "100%";
  };

  const unlockScroll = () => {
    if (!bodyStyles) return;

    document.body.style.position = bodyStyles.position;
    document.body.style.top = bodyStyles.top;
    document.body.style.right = bodyStyles.right;
    document.body.style.left = bodyStyles.left;
    document.body.style.width = bodyStyles.width;
    bodyStyles = null;
    window.scrollTo(0, lockedScrollY);
  };

  const syncAccessibility = () => {
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(trigger.dataset.headerActionOpen === activeAction));
    });

    const actionbarOpen = activeAction === "search" || activeAction === "contact";
    actionbar?.setAttribute("aria-hidden", String(!actionbarOpen));
    actionbar?.toggleAttribute("inert", !actionbarOpen);

    panels.forEach((panel) => {
      const open = panel.dataset.headerActionPanel === activeAction;
      panel.setAttribute("aria-hidden", String(!open));
      panel.toggleAttribute("inert", !open);
    });
  };

  const getFocusTarget = () => {
    if (activeAction === "search") return header.querySelector("#header-search-input");
    if (activeAction === "contact") return header.querySelector(".hd-contact input");
    return null;
  };

  const closeAction = ({ restoreFocus = true } = {}) => {
    if (!activeAction) return;

    const opener = activeOpener;
    activeAction = "";
    activeOpener = null;
    header.removeAttribute("data-header-action");
    closeSelects();
    syncAccessibility();
    unlockScroll();
    document.dispatchEvent(new CustomEvent("header-action:change", { detail: "" }));

    if (restoreFocus && opener?.isConnected) {
      window.setTimeout(() => opener.focus({ preventScroll: true }), 0);
    }
  };

  const openAction = (action, opener) => {
    if (!actions.has(action)) return;
    if (activeAction === action) {
      closeAction();
      return;
    }

    document.dispatchEvent(new CustomEvent("panel:open", { detail: "header-action" }));
    activeAction = action;
    activeOpener = opener;
    header.dataset.headerAction = action;
    header.classList.remove("hd-top-hide");
    closeSelects();
    syncAccessibility();
    lockScroll();
    document.dispatchEvent(new CustomEvent("header-action:change", { detail: action }));

    window.setTimeout(() => getFocusTarget()?.focus({ preventScroll: true }), 180);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openAction(trigger.dataset.headerActionOpen, trigger);
    });
  });

  if (jquery?.fn?.select2) {
    headerSelects.forEach((select) => {
      const filter = select.closest(".hd-filter");
      const selectElement = jquery(select);
      const isolateLatin = filter?.classList.contains("hd-filter--latin");
      const formatOption = (option) => {
        if (!isolateLatin || !option.id) return option.text;
        return jquery("<bdi>", { dir: "ltr", text: option.text });
      };
      selectElement.select2({
        width: "100%",
        dir: "rtl",
        placeholder: select.dataset.placeholder || "",
        minimumResultsForSearch: Infinity,
        dropdownParent: jquery(filter),
        templateResult: formatOption,
        templateSelection: formatOption,
      });
      selectElement.on("select2:open.headerActions", () => {
        filter?.classList.add("is-select2-open");
      });
      selectElement.on("select2:close.headerActions", () => {
        filter?.classList.remove("is-select2-open");
      });
    });

    contactSelects.forEach((select) => {
      const wrapper = select.closest(".hd-contact__select-wrap");
      const field = select.closest(".hd-contact__field");
      const selectElement = jquery(select);
      selectElement.select2({
        width: "100%",
        dir: "rtl",
        placeholder: select.dataset.placeholder || "",
        minimumResultsForSearch: Infinity,
        dropdownParent: jquery(wrapper),
      });
      selectElement.on("select2:open.headerActions", () => {
        wrapper?.classList.add("is-select2-open");
        field?.classList.add("is-select2-field-open");
      });
      selectElement.on("select2:close.headerActions", () => {
        wrapper?.classList.remove("is-select2-open");
        field?.classList.remove("is-select2-field-open");
      });
    });
  }

  closeButton?.addEventListener("click", () => closeAction());
  overlay?.addEventListener("click", () => closeAction());

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    contactForm.reportValidity();
  });

  document.addEventListener("panel:open", (event) => {
    if (event.detail !== "header-action") closeAction({ restoreFocus: false });
  });

  document.addEventListener("keydown", (event) => {
    if (!activeAction) return;

    if (event.key === "Escape") {
      const openSelect = header.querySelector(".hd-filter.is-select2-open .select2HeaderJS, .hd-contact__select-wrap.is-select2-open .select2ContactJS");
      if (openSelect && jquery?.fn?.select2) {
        event.preventDefault();
        event.stopPropagation();
        jquery(openSelect).select2("close");
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closeAction();
    }
  }, true);

  syncAccessibility();
}
