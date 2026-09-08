export default function BlogRelatedModule() {
  const sliders = [...document.querySelectorAll(".blogRelatedSliderJS")];
  if (!sliders.length || typeof window.Swiper !== "function") return;

  sliders.forEach((slider) => {
    const slideCount = slider.querySelectorAll(".swiper-slide").length;

    new window.Swiper(slider, {
      slidesPerView: 1.15,
      spaceBetween: 0,
      loop: slideCount > 4,
      speed: 700,
      grabCursor: true,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      breakpoints: {
        600: {
          slidesPerView: 2,
        },
        901: {
          slidesPerView: 3,
        },
        1201: {
          slidesPerView: 5,
        },
      },
      a11y: {
        enabled: true,
        prevSlideMessage: "الخبر السابق",
        nextSlideMessage: "الخبر التالي",
        firstSlideMessage: "هذا هو الخبر الأول",
        lastSlideMessage: "هذا هو الخبر الأخير",
        slideLabelMessage: "{{index}} من {{slidesLength}}",
      },
    });
  });
}
