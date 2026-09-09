export default function ProcessModule() {
  const slider = document.querySelector(".processSliderJS");
  if (!slider || typeof window.Swiper !== "function") return;

  const section = slider.closest(".sec-process");

  new window.Swiper(slider, {
    // A partial slide keeps the strip reading as if it carries on past the edge.
    slidesPerView: 1.1,
    speed: 700,
    loop: true,
    loopAdditionalSlides: 2,
    grabCursor: true,
    navigation: {
      prevEl: section?.querySelector(".processPrevJS"),
      nextEl: section?.querySelector(".processNextJS"),
    },
    breakpoints: {
      600: { slidesPerView: 1.6 },
      901: { slidesPerView: 2.4 },
      1201: { slidesPerView: 1.5 },
    },
    a11y: {
      enabled: true,
      prevSlideMessage: "الشريحة السابقة",
      nextSlideMessage: "الشريحة التالية",
    },
  });
}
