export default function ExhibitionModule() {
  const maps = [...document.querySelectorAll(".exhibitionMapJS")];
  if (!maps.length) return;

  if (!("IntersectionObserver" in window)) {
    maps.forEach((map) => map.classList.add("is-visible"));
    return;
  }

  maps.forEach((map) => map.classList.add("is-pending"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("is-pending");
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25 });

  maps.forEach((map) => observer.observe(map));
}
