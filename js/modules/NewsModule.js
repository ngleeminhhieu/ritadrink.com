export default function NewsModule() {
  const sliders = [...document.querySelectorAll(".newsSliderJS")];
  if (!sliders.length || typeof window.Swiper !== "function") return;

  sliders.forEach((slider) => {
    const slideCount = slider.querySelectorAll(".swiper-slide").length;

    new window.Swiper(slider, {
      slidesPerView: 1.12,
      spaceBetween: 0,
      centeredSlides: true,
      loop: slideCount > 3,
      speed: 900,
      grabCursor: true,
      watchSlidesProgress: true,
      observer: true,
      observeParents: true,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      autoplay: slideCount > 1
        ? {
            delay: 3200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,
      breakpoints: {
        600: {
          slidesPerView: 1.65,
        },
        900: {
          slidesPerView: 2.1,
        },
        1201: {
          slidesPerView: 2.7,
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
