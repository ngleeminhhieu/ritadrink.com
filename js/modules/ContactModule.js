export default function ContactModule() {
  const forms = [...document.querySelectorAll(".contactFormJS")];
  if (!forms.length) return;

  const jquery = window.jQuery;

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.reportValidity();
    });

    if (!jquery?.fn?.select2) return;

    // The header panel keeps its own selects; this only covers the page form.
    form.querySelectorAll(".select2ContactJS").forEach((select) => {
      if (select.classList.contains("select2-hidden-accessible")) return;

      const wrapper = select.closest(".hd-contact__select-wrap");
      const field = select.closest(".hd-contact__field");
      const selectElement = jquery(select);

      selectElement.select2({
        width: "100%",
        dir: "rtl",
        placeholder: select.dataset.placeholder || "",
        minimumResultsForSearch: Infinity,
        dropdownParent: jquery(wrapper),
      });

      selectElement.on("select2:open.contact", () => {
        wrapper?.classList.add("is-select2-open");
        field?.classList.add("is-select2-field-open");
      });

      selectElement.on("select2:close.contact", () => {
        wrapper?.classList.remove("is-select2-open");
        field?.classList.remove("is-select2-field-open");
      });
    });
  });
}
