import { useMemo, useState } from "react";

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
  summary = null,
  actions = null,
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState({
    count: 1,
    signature: "",
  });

  const productKeys = useMemo(() => {
    const seenProductKeys = new Set();

    return variants.reduce((keys, variant) => {
      const productKey = variant.handle || parentSku || "single-product";

      if (!seenProductKeys.has(productKey)) {
        seenProductKeys.add(productKey);
        keys.push(productKey);
      }

      return keys;
    }, []);
  }, [parentSku, variants]);

  const productKeySignature = productKeys.join("|");
  const visibleProductCount =
    visibleProducts.signature === productKeySignature ? visibleProducts.count : 1;
  const visibleProductKeys = productKeys.slice(0, visibleProductCount);
  const visibleProductKeySet = new Set(visibleProductKeys);
  const visibleVariants = variants.filter((variant) =>
    visibleProductKeySet.has(variant.handle || parentSku || "single-product"),
  );
  const remainingProductCount = Math.max(
    productKeys.length - visibleProductCount,
    0,
  );
  const revealCount = Math.min(4, remainingProductCount);

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
          <p>
            {summary
              ? `${summary.importedProductCount} imported / ${summary.productCount} ready / ${summary.excludedProductCount} excluded / ${summary.variantsPerProduct} variants per ready product / ${variants.length} total`
              : `${variants.length} generated`}
            {productKeys.length > 1
              ? ` / showing ${visibleProductKeys.length} products`
              : ""}
          </p>
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
              <th>Handle</th>
              <th>Title</th>
              <th>Texture</th>
              <th>Color 1</th>
              <th>Color 2</th>
              <th>Variant SKU</th>
              <th>Price ($)</th>
              <th>Weight</th>
            </tr>
          </thead>

          <tbody>
            {visibleVariants.map((variant, index) => (
              <tr key={`${variant.handle || parentSku}-${variant.sku}-${index}`}>
                <td>{variant.handle || parentSku}</td>
                <td>{variant.title}</td>
                <td>{variant.texture}</td>
                <td>{variant.color1}</td>
                <td>{variant.color2}</td>
                <td>{variant.sku}</td>
                <td>{variant.price}</td>
                <td>{variant.weight ?? weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remainingProductCount > 0 && (
        <button
          className="show-more-button"
          type="button"
          onClick={() =>
            setVisibleProducts({
              count: visibleProductCount + 4,
              signature: productKeySignature,
            })
          }
        >
          Show {revealCount} More {revealCount === 1 ? "Product" : "Products"}
        </button>
      )}
    </section>
  );
}

export default VariantPreview;



