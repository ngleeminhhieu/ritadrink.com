const CatalogSelectsModule = () => {
  const jquery = window.jQuery;

  if (!jquery?.fn?.select2) {
    return;
  }

  document.querySelectorAll(".select2CatalogJS").forEach((select) => {
    if (select.classList.contains("select2-hidden-accessible")) {
      return;
    }

    const field = select.closest(".catalog-select");

    if (!field) {
      return;
    }

    const selectElement = jquery(select);
    const isolateLatin = field.classList.contains("catalog-select--latin");
    const formatOption = (option) => {
      if (!isolateLatin || !option.id) {
        return option.text;
      }

      return jquery("<bdi>", { dir: "ltr", text: option.text });
    };

    selectElement.select2({
      width: "100%",
      dir: "rtl",
      placeholder: select.dataset.placeholder || "",
      minimumResultsForSearch: Infinity,
      dropdownParent: jquery(field),
      templateResult: formatOption,
      templateSelection: formatOption,
    });

    field.classList.add("is-select2-ready");

    const label = select.id
      ? field.querySelector(`label[for="${select.id}"]`)
      : null;
    const selection = field.querySelector(".select2-selection--single");
    const renderedValue = field.querySelector(".select2-selection__rendered");

    if (label && selection && renderedValue?.id) {
      label.id ||= `${select.id}-label`;
      selection.setAttribute("aria-labelledby", `${label.id} ${renderedValue.id}`);
    }

    selectElement.on("select2:open.catalogSelects", () => {
      field.classList.add("is-select2-open");
    });

    selectElement.on("select2:close.catalogSelects", () => {
      field.classList.remove("is-select2-open");
    });
  });
};

export default CatalogSelectsModule;
