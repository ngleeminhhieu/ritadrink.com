export default function MobileSubModule() {
  const mobile = document.querySelector(".mobile");
  if (!mobile) return;

  const triggers = [...mobile.querySelectorAll(".mobileSubJS")];
  const panels = [...mobile.querySelectorAll(".mobile-sub[data-sub-panel]")];

  const closeAll = () => {
    panels.forEach((panel) => panel.classList.remove("open"));
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  };

  triggers.forEach((trigger) => {
    const key = trigger.dataset.sub;
    const panel = mobile.querySelector(`[data-sub-panel="${key}"]`);
    if (!panel) return;

    panel.id = `mobile-sub-${key}`;
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      closeAll();
      panel.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      panel.querySelector(".mobileBackJS")?.focus({ preventScroll: true });
    });
  });

  mobile.querySelectorAll(".mobileBackJS").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest(".mobile-sub");
      const key = panel?.dataset.subPanel;
      panel?.classList.remove("open");
      const trigger = mobile.querySelector(`.mobileSubJS[data-sub="${key}"]`);
      trigger?.setAttribute("aria-expanded", "false");
      trigger?.focus({ preventScroll: true });
    });
  });

  document.addEventListener("mobile:close", closeAll);
}
