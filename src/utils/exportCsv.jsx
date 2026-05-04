import Papa from "papaparse";

export function getVariantCsvRows(variants = [], parentSku = "") {
  return variants.map((variant) => ({
    handle: parentSku || "",
    "option value 1": variant.title,
    "variant sku": variant.sku,
    "variant price": variant.price || "",
    weight: "",
    "inventory policy": "",
    "inventory tracking": "",
  }));
}

export function buildVariantsCsv(variants = [], parentSku = "") {
  return Papa.unparse(getVariantCsvRows(variants, parentSku));
}

export function exportVariantsToCsv(variants, parentSku = "variants") {
  if (!variants || variants.length === 0) {
    return;
  }

  const csv = buildVariantsCsv(variants, parentSku);

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
