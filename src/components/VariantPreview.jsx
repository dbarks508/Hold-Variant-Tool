import { useState } from "react";

import { getVariantCsvRows } from "../utils/exportCsv";

const copyHeaders = [
  "handle",
  "option value 1",
  "variant sku",
  "variant price",
  "weight",
];

function VariantPreview({
  variants = [],
  parentSku = "",
  weight = "",
  inventoryOptions = {},
  actions = null,
}) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyTable() {
    const rows = getVariantCsvRows(
      variants,
      parentSku,
      weight,
      inventoryOptions,
    ).map((row) => copyHeaders.map((header) => row[header]));
    const tableText = [copyHeaders, ...rows]
      .map((row) => row.map((value) => value || "").join("\t"))
      .join("\n");

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(tableText);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = tableText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  }

  return (
    <section className="tool-section preview-section">
      <div className="section-heading">
        <h2>Generated Variants</h2>
        <div className="section-actions">
          <p>{variants.length} generated</p>
          <button
            className="copy-button"
            type="button"
            disabled={variants.length === 0}
            onClick={copyTable}
          >
            {isCopied ? "Copied" : "Copy Table"}
          </button>
          {actions}
        </div>
      </div>

      <div className="table-wrap">
        <table className="variant-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Texture</th>
              <th>Color 1</th>
              <th>Color 2</th>
              <th>Variant SKU</th>
              <th>Price ($)</th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant) => (
              <tr key={variant.sku}>
                <td>{variant.title}</td>
                <td>{variant.texture}</td>
                <td>{variant.color1}</td>
                <td>{variant.color2}</td>
                <td>{variant.sku}</td>
                <td>{variant.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default VariantPreview;
