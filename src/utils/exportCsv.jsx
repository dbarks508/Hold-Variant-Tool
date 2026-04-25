import Papa from "papaparse";

export function exportVariantsToCsv(variants, parentSku = "variants") {
  if (!variants || variants.length === 0) {
    return;
  }

  const csvRows = variants.map((variant) => ({
    handle: parentSku || "",
    "variant option 1 value": variant.title,
    "variant sku": variant.sku,
    price: variant.price || "",
  }));

  const csv = Papa.unparse(csvRows);

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
