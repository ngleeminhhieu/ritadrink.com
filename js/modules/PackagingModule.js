// Two shipping slots follow every stocked format: the container dimension
// diagram, then the load table. They are the same for all of them, so they live
// here rather than being repeated twenty-eight times in the data.
const SHOT_OVERVIEW = "./assets/images/containers-overview.png";
const SHOT_CONTAINER = "./assets/images/container.png";

const UNIT_LABEL = { cans: "علبة", bottles: "زجاجة" };

// The container measurements are fixed; only the counts travel per format.
const LOAD_ROWS = [
  ["ft20", "20 قدمًا", "6.06 م", "2.44 م", "2.59 م"],
  ["ft40", "40 قدمًا", "12.19 م", "2.44 م", "2.59 م"],
  ["hc40", "40 قدمًا هاي كيوب", "12.19 م", "2.44 م", "2.90 م"],
];

const loadTable = (load) => {
  const unit = UNIT_LABEL[load.unit] ?? load.unit;
  const rows = LOAD_ROWS
    .map(([key, name, length, width, height]) => `<tr><th scope="row">${name}</th><td>${length}</td><td>${width}</td><td>${height}</td><td>&asymp; ${load[key]} ${unit}</td></tr>`)
    .join("");

  // The table scrolls sideways on narrow screens, so it opts out of dragging.
  return `<div class="pkg__load">
            <div class="pkg__load-scroll swiper-no-swiping">
              <table class="pkg__load-table">
                <thead><tr><th scope="col">الحاوية</th><th scope="col">الطول</th><th scope="col">العرض</th><th scope="col">الارتفاع</th><th scope="col">المنتج</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            <p class="pkg__load-note">الحد الأدنى للطلب <strong>حاوية واحدة 20 قدمًا</strong></p>
          </div>`;
};

export default function PackagingModule() {
  const root = document.querySelector(".pkgRootJS");
  if (!root) return;

  const source = root.querySelector(".pkgDataJS");
  const stage = root.querySelector(".pkgStageJS");
  const thumbs = root.querySelector(".pkgThumbsJS");
  const sizes = root.querySelector(".pkgSizesJS");
  const materials = [...root.querySelectorAll("[data-pkg-material]")];
  const wrapper = stage?.querySelector(".swiper-wrapper");
  if (!source || !wrapper || !thumbs || !sizes || !materials.length) return;

  let formats = [];
  try {
    formats = JSON.parse(source.textContent);
  } catch (error) {
    return;
  }
  if (!formats.length) return;

  let material = materials.find((button) => button.classList.contains("is-active"))
    ?.dataset.pkgMaterial ?? materials[0].dataset.pkgMaterial;
  let sizeIndex = 0;
  let shotIndex = 0;
  let slider = null;
  let sizeSlider = null;

  // Both pickers are sliders: one row of materials, two rows of sizes. Flush
  // slides keep the cells' own end borders reading as continuous rules.
  const PICKER = {
    speed: 450,
    spaceBetween: 0,
    slidesPerView: 4,
    grabCursor: true,
    watchOverflow: true,
    breakpoints: {
      1201: { slidesPerView: 5 },
    },
  };

  const buildSizeSlider = () => {
    if (sizeSlider) {
      sizeSlider.destroy(true, false);
      sizeSlider = null;
    }
    if (typeof window.Swiper === "undefined") return;

    const el = root.querySelector(".pkgSizeJS");
    if (!el) return;

    sizeSlider = new window.Swiper(el, {
      ...PICKER,
      grid: { rows: 2, fill: "row" },
    });
  };

  const inMaterial = () => formats.filter((format) => format.material === material);

  const shotsOf = (format) => {
    const shots = format.images.map((src) => ({ src, thumb: src }));
    if (!format.load) return shots;

    shots.push({ src: SHOT_OVERVIEW, thumb: SHOT_OVERVIEW, label: "أبعاد الحاوية" });
    shots.push({ load: format.load, thumb: SHOT_CONTAINER, label: "جدول التحميل في الحاوية" });
    return shots;
  };

  const syncThumbs = () => {
    [...thumbs.children].forEach((thumb, index) => {
      thumb.classList.toggle("is-active", index === shotIndex);
    });
  };

  const buildSlider = (count) => {
    if (slider) {
      slider.destroy(true, true);
      slider = null;
    }
    if (typeof window.Swiper === "undefined") return;

    slider = new window.Swiper(stage, {
      speed: 500,
      slidesPerView: 1,
      initialSlide: shotIndex,
      grabCursor: count > 1,
      allowTouchMove: count > 1,
      navigation: {
        prevEl: root.querySelector(".pkgPrevJS"),
        nextEl: root.querySelector(".pkgNextJS"),
      },
      a11y: {
        enabled: true,
        prevSlideMessage: "الشريحة السابقة",
        nextSlideMessage: "الشريحة التالية",
      },
      on: {
        slideChange: (instance) => {
          shotIndex = instance.activeIndex;
          syncThumbs();
        },
      },
    });
  };

  const paintStage = () => {
    const format = inMaterial()[sizeIndex];
    if (!format) return;

    // "Your Size" has nothing to show: the viewer becomes the lead capture and
    // the slider is torn down so it cannot be reached behind it.
    root.classList.toggle("is-custom", Boolean(format.custom));
    if (format.custom) {
      const shot = root.querySelector(".pkgCtaShotJS");
      if (shot && format.images[0]) shot.src = format.images[0];

      if (slider) {
        slider.destroy(true, true);
        slider = null;
      }
      wrapper.innerHTML = "";
      thumbs.innerHTML = "";
      return;
    }

    const shots = shotsOf(format);
    shotIndex = Math.min(shotIndex, shots.length - 1);

    wrapper.innerHTML = shots
      .map((shot) => `<div class="swiper-slide">${shot.load
        ? loadTable(shot.load)
        : `<img src="${shot.src}" alt="${shot.label ?? format.name}" decoding="async">`}</div>`)
      .join("");

    thumbs.innerHTML = shots
      .map((shot, index) => `<button class="pkg-thumb${index === shotIndex ? " is-active" : ""}" type="button" data-pkg-shot="${index}" aria-label="${shot.label ?? format.name}"><img src="${shot.thumb}" alt="" aria-hidden="true" loading="lazy" decoding="async"></button>`)
      .join("");

    buildSlider(shots.length);
  };

  // The section closes its own bottom edge across both halves, so the cells that
  // land on it must not draw one too. Which cells those are depends on the
  // column count, which changes with the breakpoint -- read it back from layout.
  const markLastRow = () => {
    const cells = [...sizes.children];
    if (!cells.length) return;

    const bottom = Math.max(...cells.map((cell) => cell.offsetTop));
    cells.forEach((cell) => cell.classList.toggle("is-last-row", cell.offsetTop === bottom));
  };

  const paintSizes = () => {
    sizeIndex = 0;
    shotIndex = 0;

    sizes.innerHTML = inMaterial()
      .map((format, index) => `<button class="pkg-cell pkg-cell--size swiper-slide${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-pkg-size="${index}"><img src="${format.images[0]}" alt="${format.name}" loading="lazy" decoding="async"></button>`)
      .join("");

    buildSizeSlider();
    markLastRow();
    paintStage();
  };

  materials.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.pkgMaterial === material) return;

      material = button.dataset.pkgMaterial;
      materials.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });

      paintSizes();
    });
  });

  sizes.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-pkg-size]");
    if (!cell) return;

    sizeIndex = Number(cell.dataset.pkgSize);
    shotIndex = 0;

    [...sizes.children].forEach((item) => {
      const active = item === cell;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });

    paintStage();
  });

  thumbs.addEventListener("click", (event) => {
    const thumb = event.target.closest("[data-pkg-shot]");
    if (!thumb) return;

    const index = Number(thumb.dataset.pkgShot);
    if (slider) {
      slider.slideTo(index);
      return;
    }

    shotIndex = index;
    syncThumbs();
  });

  window.addEventListener("resize", markLastRow);

  if (typeof window.Swiper !== "undefined") {
    const materialEl = root.querySelector(".pkgMaterialJS");
    if (materialEl) new window.Swiper(materialEl, PICKER);
  }

  paintSizes();
}
