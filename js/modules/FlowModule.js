export default function FlowModule() {
  const list = document.querySelector(".flowStepsJS");
  if (!list) return;

  const section = list.closest(".sec-flow");
  const media = section?.querySelector(".flowMediaJS");
  const steps = [...list.querySelectorAll(".flow-step")];
  if (!media || steps.length < 2) return;

  const frame = media.closest(".flow__media");

  // Preload so the swap lands on a decoded image rather than a blank frame.
  steps.forEach((step) => {
    const src = step.dataset.flowImg;
    if (src) new Image().src = src;
  });

  const select = (step) => {
    if (step.classList.contains("is-active")) return;

    steps.forEach((item) => item.classList.toggle("is-active", item === step));

    const src = step.dataset.flowImg;
    if (!src || media.getAttribute("src") === src) return;

    frame?.classList.add("is-swapping");
    const swap = () => {
      media.src = src;
      frame?.classList.remove("is-swapping");
    };

    // Wait out the fade, then change the source under cover of it.
    window.setTimeout(swap, 200);
  };

  steps.forEach((step) => {
    step.addEventListener("pointerenter", () => select(step));
    step.addEventListener("click", () => select(step));
    step.addEventListener("focus", () => select(step));
    step.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      select(step);
    });
  });
}
