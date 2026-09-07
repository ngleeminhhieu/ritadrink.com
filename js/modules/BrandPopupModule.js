const BRANDS = {
  rita: {
    name: "RITA",
    desc: "منتجات RITA معتمدة للأسواق المحلية والدولية على حد سواء، بما في ذلك بعض أكثر الأسواق صرامة في العالم، حيث لا مجال للتهاون في المعايير.",
    logo: "./assets/images/brand-rita.png",
    slides: ["./assets/images/brand-rita-1.jpg"],
  },
  trobico: {
    name: "Trobico",
    desc: "تقدّم Trobico مفاهيم مشروبات مبتكرة ومنعشة، مصنوعة وفق معايير الجودة الصارمة نفسها التي تلتزم بها الشركة الأم RITA. من تطوير النكهة حتى الإنتاج، كل تفصيل مصمم ليلبي توقعات الأسواق العالمية.",
    logo: "./assets/images/brand-trobico.png",
    slides: ["./assets/images/brand-trobico-1.jpg"],
  },
  trobest: {
    name: "TroBest",
    desc: "تمثّل TroBest الثبات والموثوقية على نطاق واسع، بتقديم مشروبات تحقق المعايير الدولية دفعة بعد دفعة. وبدعم من خبرة RITA في التصنيع، أصبحت TroBest شريكًا موثوقًا للأسواق التي تتطلب الدقة.",
    logo: "./assets/images/brand-trobest.png",
    slides: ["./assets/images/brand-trobest-1.jpg"],
  },
};

export default function BrandPopupModule() {
  const popup = document.querySelector(".brandPopupJS");
  if (!popup) return;

  const header = document.querySelector(".hd");
  const slidesWrap = popup.querySelector(".brandSlidesJS");
  const nameEl = popup.querySelector(".brandNameJS");
  const descEl = popup.querySelector(".brandDescJS");
  const alsoEl = popup.querySelector(".brandAlsoJS");
  const grid = document.querySelector(".brandGridJS");
  const cards = [...document.querySelectorAll(".brandOpenJS")];
  const loadMore = document.querySelector(".brandLoadMoreJS");
  const pageSize = Math.max(1, Number.parseInt(grid?.dataset.pageSize, 10) || 8);
  let visibleCount = Math.min(pageSize, cards.length);
  let currentKey = "";
  let opener = null;
  let slider = null;

  // A hidden brand must disappear from the grid and from "you may also like".
  const visibleKeys = () => cards.slice(0, visibleCount).map((card) => card.dataset.brand);

  const renderPaging = () => {
    cards.forEach((card, index) => {
      const visible = index < visibleCount;
      card.hidden = !visible;
      card.classList.toggle("is-hidden", !visible);
    });

    if (loadMore) {
      const complete = visibleCount >= cards.length;
      loadMore.hidden = complete;
      loadMore.setAttribute("aria-expanded", String(complete));
    }
  };

  const buildSlides = (brand) => {
    slidesWrap.innerHTML = brand.slides
      .map((src) => `<div class="swiper-slide"><img src="${src}" alt="${brand.name}" loading="lazy" decoding="async"></div>`)
      .join("");
  };

  const buildAlso = (activeKey) => {
    const keys = visibleKeys().filter((key) => key !== activeKey && BRANDS[key]);

    alsoEl.style.setProperty("--brand-also-count", String(Math.max(1, keys.length)));
    alsoEl.innerHTML = keys
      .map((key) => `<button class="card-item is-brand brandSwitchJS" type="button" data-brand="${key}" aria-label="عرض علامة ${BRANDS[key].name}"><img src="${BRANDS[key].logo}" alt="${BRANDS[key].name}"></button>`)
      .join("");
  };

  const syncSlider = () => {
    if (typeof window.Swiper !== "function") return;

    if (slider) {
      slider.update();
      slider.slideTo(0, 0);
      return;
    }

    slider = new window.Swiper(popup.querySelector(".brandSliderJS"), {
      slidesPerView: 1,
      speed: 600,
      grabCursor: true,
      watchOverflow: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      a11y: {
        enabled: true,
        prevSlideMessage: "الصورة السابقة",
        nextSlideMessage: "الصورة التالية",
      },
    });
  };

  const render = (key) => {
    const brand = BRANDS[key];
    if (!brand) return;

    currentKey = key;
    nameEl.textContent = brand.name;
    descEl.textContent = brand.desc;
    buildSlides(brand);
    buildAlso(key);
    syncSlider();
  };

  // Open first, then render: Swiper measures wrong while the panel has no layout.
  const open = (key, trigger) => {
    document.dispatchEvent(new CustomEvent("panel:open", { detail: "brand-popup" }));
    opener = trigger || null;
    popup.classList.add("is-open");
    popup.setAttribute("aria-hidden", "false");
    popup.removeAttribute("inert");
    document.body.classList.add("no-scroll");
    render(key);
    window.setTimeout(() => popup.querySelector(".brandCloseJS")?.focus({ preventScroll: true }), 180);
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!popup.classList.contains("is-open")) return;

    popup.classList.remove("is-open");
    popup.setAttribute("aria-hidden", "true");
    popup.setAttribute("inert", "");
    document.body.classList.remove("no-scroll");

    if (restoreFocus && opener?.isConnected) {
      opener.focus({ preventScroll: true });
    }
    opener = null;
  };

  renderPaging();

  cards.forEach((card) => {
    card.addEventListener("click", () => open(card.dataset.brand, card));
  });

  loadMore?.addEventListener("click", () => {
    const firstNewCard = cards[visibleCount];
    visibleCount = Math.min(visibleCount + pageSize, cards.length);
    renderPaging();
    firstNewCard?.focus({ preventScroll: true });
    if (currentKey && popup.classList.contains("is-open")) render(currentKey);
  });

  popup.querySelectorAll(".brandCloseJS").forEach((button) => {
    button.addEventListener("click", () => close());
  });

  alsoEl.addEventListener("click", (event) => {
    const item = event.target.closest(".brandSwitchJS");
    if (item) render(item.dataset.brand);
  });

  // Hand over to the header opener so its scroll lock, focus and aria stay in sync.
  popup.querySelector(".brandCtaJS")?.addEventListener("click", () => {
    close({ restoreFocus: false });
    window.requestAnimationFrame(() => {
      header?.querySelector('[data-header-action-open="contact"]')?.click();
    });
  });

  document.addEventListener("panel:open", (event) => {
    if (event.detail !== "brand-popup") close({ restoreFocus: false });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("is-open")) {
      event.preventDefault();
      close();
    }
  });
}
