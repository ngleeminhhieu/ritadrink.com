export default function MobileModule() {
  const mobile = document.querySelector(".mobile");
  const burgerButton = document.getElementById("hamburger");
  const overlay = document.querySelector(".mobile-overlay");
  if (!mobile || !burgerButton || !overlay) return;

  const desktop = window.matchMedia("(min-width: 1201px)");
  let isOpen = false;

  const setState = (open) => {
    isOpen = open;
    burgerButton.classList.toggle("active", open);
    mobile.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    document.body.classList.toggle("no-scroll", open);
    burgerButton.setAttribute("aria-expanded", String(open));
    burgerButton.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");

    if (!open) document.dispatchEvent(new CustomEvent("mobile:close"));
  };

  const openMenu = () => {
    if (isOpen) return;
    document.dispatchEvent(new CustomEvent("panel:open", { detail: "mobile-menu" }));
    setState(true);
  };

  const closeMenu = () => {
    if (!isOpen) return;
    setState(false);
  };

  burgerButton.addEventListener("click", () => {
    if (isOpen) closeMenu();
    else openMenu();
  });
  overlay.addEventListener("click", closeMenu);

  document.addEventListener("panel:open", (event) => {
    if (event.detail !== "mobile-menu") closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen || mobile.contains(event.target) || burgerButton.contains(event.target)) return;
    closeMenu();
  });

  desktop.addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}
