export default function BannerCtaModule() {
  const banners = [...document.querySelectorAll(".bannerCtaJS")];
  if (!banners.length || !("IntersectionObserver" in window)) return;

  banners.forEach((banner) => banner.classList.add("is-pending"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.remove("is-pending");
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.2,
    rootMargin: "0px 0px -8%",
  });

  banners.forEach((banner) => observer.observe(banner));
}
