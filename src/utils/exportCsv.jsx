import Papa from "papaparse";

import { getVariantCsvRows } from "./buildVariantExport.js";

export {
  getVariantCsvHeaders,
  getVariantCsvRows,
} from "./buildVariantExport.js";

export function buildVariantsCsv(
  variants = [],
  parentSku = "",
  weight = "",
  exportOptions = {},
) {
  return Papa.unparse(
    getVariantCsvRows(variants, parentSku, weight, exportOptions),
  );
}

export function exportVariantsToCsv(
  variants,
  parentSku = "variants",
  weight = "",
  exportOptions = {},
  fileName = "",
) {
  if (!variants || variants.length === 0) {
    return;
  }

  const csv = buildVariantsCsv(variants, parentSku, weight, exportOptions);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName || parentSku || "variants"}-variants.csv`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
