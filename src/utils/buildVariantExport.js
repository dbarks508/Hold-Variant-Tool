import {
  newProductProductFields,
  newProductVariantTextFields,
} from "../data/newProductExportOptions.js";

const baseVariantHeaders = [
  "option value 1",
  "variant sku",
  "variant price",
  "weight",
];

function formatBoolean(value) {
  return value ? "TRUE" : "FALSE";
}

export function getVariantCsvHeaders(exportOptions = {}) {
  if (!exportOptions.isNewProduct) {
    return ["handle", ...baseVariantHeaders];
  }

  return [
    "handle",
    "option name 1",
    ...baseVariantHeaders,
    "requires shipping",
    ...(exportOptions.inventoryPolicyEnabled ? ["inventory policy"] : []),
    ...(exportOptions.inventoryTrackingEnabled
      ? ["inventory tracking"]
      : []),
    "track quantity",
    ...newProductProductFields
      .filter((field) => field.key !== "optionName1")
      .map((field) => field.header),
    ...newProductVariantTextFields.map((field) => field.header),
  ];
}

export function getVariantCsvRows(
  variants = [],
  parentSku = "",
  weight = "",
  exportOptions = {},
) {
  const headers = getVariantCsvHeaders(exportOptions);
  const seenHandles = new Set();

  return variants.map((variant) => {
    const handle = variant.handle || parentSku || "";
    const isFirstProductRow = !seenHandles.has(handle);
    const values = {
      handle,
      "option value 1": variant.title,
      "variant sku": variant.sku,
      "variant price": variant.price || "",
      weight: variant.weight ?? weight,
    };

    seenHandles.add(handle);

    if (exportOptions.isNewProduct) {
      values["option name 1"] = isFirstProductRow
        ? exportOptions.optionName1 || ""
        : "";
      values["requires shipping"] = formatBoolean(
        exportOptions.requiresShipping,
      );
      values["track quantity"] = formatBoolean(exportOptions.trackQuantity);

      newProductVariantTextFields.forEach((field) => {
        values[field.header] = exportOptions[field.key] ?? "";
      });

      newProductProductFields
        .filter((field) => field.key !== "optionName1")
        .forEach((field) => {
          values[field.header] = isFirstProductRow
            ? exportOptions[field.key] || ""
            : "";
        });

      if (exportOptions.inventoryPolicyEnabled) {
        values["inventory policy"] = "continue";
      }

      if (exportOptions.inventoryTrackingEnabled) {
        values["inventory tracking"] = "shopify";
      }
    }

    return Object.fromEntries(
      headers.map((header) => [header, values[header] ?? ""]),
    );
  });
}
