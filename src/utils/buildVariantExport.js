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
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "yes", "1"].includes(normalizedValue)) {
      return "TRUE";
    }

    if (["false", "no", "0"].includes(normalizedValue)) {
      return "FALSE";
    }
  }

  return value ? "TRUE" : "FALSE";
}

function getUploadedValue(variant, key) {
  const value = variant.newProductExportValues?.[key];

  return value === undefined || value === "" ? undefined : value;
}

function hasUploadedValue(variants, key) {
  return variants.some((variant) => getUploadedValue(variant, key) !== undefined);
}

export function getVariantCsvHeaders(exportOptions = {}, variants = []) {
  if (!exportOptions.isNewProduct) {
    return ["handle", ...baseVariantHeaders];
  }

  return [
    "handle",
    "option name 1",
    ...baseVariantHeaders,
    "requires shipping",
    ...(exportOptions.inventoryPolicyEnabled ||
    hasUploadedValue(variants, "inventoryPolicy")
      ? ["inventory policy"]
      : []),
    ...(exportOptions.inventoryTrackingEnabled ||
    hasUploadedValue(variants, "inventoryTracking")
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
  const headers = getVariantCsvHeaders(exportOptions, variants);
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
        ? getUploadedValue(variant, "optionName1") ||
          exportOptions.optionName1 ||
          ""
        : "";
      values["requires shipping"] = formatBoolean(
        getUploadedValue(variant, "requiresShipping") ??
          exportOptions.requiresShipping,
      );
      values["track quantity"] = formatBoolean(
        getUploadedValue(variant, "trackQuantity") ??
          exportOptions.trackQuantity,
      );

      newProductVariantTextFields.forEach((field) => {
        values[field.header] =
          getUploadedValue(variant, field.key) ??
          exportOptions[field.key] ??
          "";
      });

      newProductProductFields
        .filter((field) => field.key !== "optionName1")
        .forEach((field) => {
          values[field.header] = isFirstProductRow
            ? getUploadedValue(variant, field.key) ||
              exportOptions[field.key] ||
              ""
            : "";
        });

      if (headers.includes("inventory policy")) {
        values["inventory policy"] =
          getUploadedValue(variant, "inventoryPolicy") ||
          (exportOptions.inventoryPolicyEnabled ? "continue" : "");
      }

      if (headers.includes("inventory tracking")) {
        values["inventory tracking"] =
          getUploadedValue(variant, "inventoryTracking") ||
          (exportOptions.inventoryTrackingEnabled ? "shopify" : "");
      }
    }

    return Object.fromEntries(
      headers.map((header) => [header, values[header] ?? ""]),
    );
  });
}
