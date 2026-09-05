const FANCYBOX_SELECTOR = '[data-fancybox="certificates"]';
const FANCYBOX_OPTIONS = {
  dragToClose: true,
  placeFocusBack: true,
};

const refreshFancybox = () => {
  if (!window.Fancybox?.bind) return;

  window.Fancybox.unbind?.(FANCYBOX_SELECTOR);
  window.Fancybox.bind(FANCYBOX_SELECTOR, FANCYBOX_OPTIONS);
};

export default function CertificatesModule() {
  const grids = [...document.querySelectorAll(".certificateGridJS")];
  if (!grids.length) return;

  grids.forEach((grid) => {
    const items = [...grid.querySelectorAll(".certificate-card")];
    const pageSize = Math.max(1, Number.parseInt(grid.dataset.pageSize, 10) || 8);
    const section = grid.closest(".certificate-list");
    const loadMore = section?.querySelector(".certificateLoadMoreJS");
    const fancyboxGroups = new WeakMap();
    let visibleCount = Math.min(pageSize, items.length);

    items.forEach((item) => {
      fancyboxGroups.set(item, item.dataset.fancybox || "certificates");
    });

    const render = () => {
      items.forEach((item, index) => {
        const visible = index < visibleCount;
        item.hidden = !visible;
        item.classList.toggle("is-hidden", !visible);

        if (visible) {
          item.dataset.fancybox = fancyboxGroups.get(item);
          item.removeAttribute("aria-hidden");
        } else {
          item.removeAttribute("data-fancybox");
          item.setAttribute("aria-hidden", "true");
        }
      });

      if (loadMore) {
        const complete = visibleCount >= items.length;
        loadMore.hidden = complete;
        loadMore.setAttribute("aria-expanded", String(complete));
      }

      refreshFancybox();
    };

    loadMore?.addEventListener("click", () => {
      const firstNewItem = items[visibleCount];
      visibleCount = Math.min(visibleCount + pageSize, items.length);
      render();
      firstNewItem?.focus({ preventScroll: true });
    });

    render();
  });
}
