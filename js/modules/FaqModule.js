export default function FaqModule() {
  const roots = [...document.querySelectorAll(".faqRootJS")];
  if (!roots.length) return;

  roots.forEach((root) => {
    const items = [...root.querySelectorAll(".faq-item")];
    if (!items.length) return;

    const bodyOf = (item) => item.querySelector(".faq-item__body");

    // The body is clipped at max-height 0, so its scrollHeight is still the full
    // answer and can be pinned as the open height for the transition.
    const setOpen = (item, open) => {
      const body = bodyOf(item);
      const toggle = item.querySelector(".faq-item__toggle");
      if (!body || !toggle) return;

      item.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      body.style.maxHeight = open ? `${body.scrollHeight}px` : "";
    };

    items.forEach((item) => {
      const toggle = item.querySelector(".faq-item__toggle");
      if (!toggle) return;

      toggle.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        items.forEach((other) => setOpen(other, other === item && open));
      });

      setOpen(item, item.classList.contains("is-open"));
    });

    // A reflow changes how many lines an answer takes, so the pinned height has
    // to be measured again.
    window.addEventListener("resize", () => {
      const open = items.find((item) => item.classList.contains("is-open"));
      if (!open) return;

      const body = bodyOf(open);
      body.style.maxHeight = "";
      body.style.maxHeight = `${body.scrollHeight}px`;
    });
  });
}
