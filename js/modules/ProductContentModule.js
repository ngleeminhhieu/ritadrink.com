const ProductContentModule = () => {
  document.querySelectorAll(".productContentJS").forEach((root) => {
    const region = root.querySelector(".productContentRegionJS");
    const content = root.querySelector(".productContentInnerJS");
    const toggle = root.querySelector(".productContentToggleJS");
    const label = toggle?.querySelector(".productContentToggleLabelJS");

    if (!region || !content || !toggle || !label) {
      return;
    }

    let isExpanded = false;
    let resizeFrame;

    const updateExpandedHeight = () => {
      root.style.setProperty("--product-content-expanded-height", `${content.scrollHeight}px`);
    };

    const setExpanded = (expanded) => {
      isExpanded = expanded;
      updateExpandedHeight();
      root.classList.toggle("is-expanded", isExpanded);
      toggle.setAttribute("aria-expanded", String(isExpanded));
      label.textContent = isExpanded
        ? toggle.dataset.labelCollapse
        : toggle.dataset.labelMore;
    };

    const initialise = () => {
      // Apply the collapsed constraint first so clientHeight can be compared
      // with the full content height without relying on a hard-coded pixel value.
      root.classList.add("is-product-content-ready", "is-collapsible");
      updateExpandedHeight();

      const isCollapsible = content.scrollHeight > region.clientHeight + 1;
      root.classList.toggle("is-collapsible", isCollapsible);
      toggle.hidden = !isCollapsible;

      if (!isCollapsible) {
        setExpanded(false);
      }
    };

    toggle.addEventListener("click", () => {
      setExpanded(!isExpanded);
    });

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(updateExpandedHeight);
      });
      resizeObserver.observe(content);
    } else {
      window.addEventListener("resize", updateExpandedHeight, { passive: true });
    }

    initialise();
    document.fonts?.ready.then(() => {
      if (!isExpanded) initialise();
      else updateExpandedHeight();
    });
  });
};

export default ProductContentModule;
