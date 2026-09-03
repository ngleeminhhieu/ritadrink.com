import PreloaderModule from "./modules/PreloaderModule.js";
import HeaderModule from "./modules/HeaderModule.js";
import HeaderActionsModule from "./modules/HeaderActionsModule.js";
import MobileModule from "./modules/MobileModule.js";
import MobileSubModule from "./modules/MobileSubModule.js";
import IntroductionVideoModule from "./modules/IntroductionVideoModule.js";
import CountUpModule from "./modules/CountUpModule.js";
import ExhibitionModule from "./modules/ExhibitionModule.js";

const initTemplateUtilities = () => {
  document.querySelector(".backToTopJS")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (window.Fancybox?.bind) {
    window.Fancybox.bind("[data-fancybox]", {
      dragToClose: true,
      placeFocusBack: true,
    });
  }
};

const initHeroSlider = () => {
  const slider = document.querySelector(".heroSliderJS");

  if (!slider || typeof window.Swiper !== "function") {
    return;
  }

  const hero = slider.closest(".hero-banner");
  const slideCount = slider.querySelectorAll(".swiper-slide").length;
  const autoplayDelay = 6000;
  const autoplayEnabled = slideCount > 1;
  const welcomeIsActive = Boolean(document.querySelector(".welcome-screen:not(.is-done)"));
  const desktopHero = window.matchMedia("(min-width: 1201px)");
  let heroSwiper;
  let heroResizeFrame;

  hero?.style.setProperty("--hero-autoplay-delay", `${autoplayDelay}ms`);
  hero?.classList.toggle("has-autoplay-progress", autoplayEnabled);
  hero?.classList.remove("is-autoplay-paused");

  const updateHeroHeight = () => {
    if (desktopHero.matches) {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      hero?.style.setProperty("--hero-desktop-height", `${Math.round(viewportHeight)}px`);
    } else {
      hero?.style.removeProperty("--hero-desktop-height");
    }

    heroSwiper?.update();
  };

  const requestHeroResize = () => {
    window.cancelAnimationFrame(heroResizeFrame);
    heroResizeFrame = window.requestAnimationFrame(updateHeroHeight);
  };

  updateHeroHeight();

  heroSwiper = new window.Swiper(slider, {
    slidesPerView: 1,
    speed: 700,
    loop: slideCount > 1,
    watchOverflow: false,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    autoplay: autoplayEnabled
      ? {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }
      : false,
    navigation: {
      prevEl: hero?.querySelector(".heroPrevJS"),
      nextEl: hero?.querySelector(".heroNextJS"),
    },
    pagination: {
      el: hero?.querySelector(".heroPaginationJS"),
      clickable: true,
    },
    a11y: {
      enabled: true,
      prevSlideMessage: "الشريحة السابقة",
      nextSlideMessage: "الشريحة التالية",
      firstSlideMessage: "هذه هي الشريحة الأولى",
      lastSlideMessage: "هذه هي الشريحة الأخيرة",
      paginationBulletMessage: "الانتقال إلى الشريحة {{index}}",
    },
    on: {
      autoplayStart() {
        hero?.classList.remove("is-autoplay-paused");
      },
      autoplayPause() {
        hero?.classList.add("is-autoplay-paused");
      },
      autoplayResume() {
        hero?.classList.remove("is-autoplay-paused");
      },
      autoplayStop() {
        hero?.classList.add("is-autoplay-paused");
      },
    },
  });

  if (autoplayEnabled && welcomeIsActive) {
    heroSwiper.autoplay.stop();
    document.addEventListener("welcome:dismissed", () => {
      heroSwiper.autoplay.start();
    }, { once: true });
  }

  window.addEventListener("resize", requestHeroResize, { passive: true });
  window.visualViewport?.addEventListener("resize", requestHeroResize, { passive: true });
  desktopHero.addEventListener("change", requestHeroResize);
};

const init = () => {
  PreloaderModule();
  HeaderModule();
  HeaderActionsModule();
  MobileModule();
  MobileSubModule();
  IntroductionVideoModule();
  CountUpModule();
  ExhibitionModule();
  initHeroSlider();
  initTemplateUtilities();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
