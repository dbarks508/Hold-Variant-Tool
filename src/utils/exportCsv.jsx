import Papa from "papaparse";

export function getVariantCsvRows(
  variants = [],
  parentSku = "",
  weight = "",
  inventoryOptions = {},
) {
  return variants.map((variant) => {
    const row = {
      handle: parentSku || "",
      "option value 1": variant.title,
      "variant sku": variant.sku,
      "variant price": variant.price || "",
      weight,
    };

    if (inventoryOptions.policy) {
      row["inventory policy"] = inventoryOptions.policy;
    }

    if (inventoryOptions.tracking) {
      row["inventory tracking"] = inventoryOptions.tracking;
    }

    return row;
  });
}

export function buildVariantsCsv(
  variants = [],
  parentSku = "",
  weight = "",
  inventoryOptions = {},
) {
  return Papa.unparse(
    getVariantCsvRows(variants, parentSku, weight, inventoryOptions),
  );
}

export function exportVariantsToCsv(
  variants,
  parentSku = "variants",
  weight = "",
  inventoryOptions = {},
) {
  if (!variants || variants.length === 0) {
    return;
  }

  const csv = buildVariantsCsv(variants, parentSku, weight, inventoryOptions);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${parentSku || "variants"}-variants.csv`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
