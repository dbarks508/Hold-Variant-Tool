import { useState } from "react";

import {
  newProductPriceSheetBaseHeaders,
  newProductSinglePriceSheetBaseHeaders,
} from "../data/newProductExportOptions";
import { textures } from "../data/textures";
import { isBarockaManufacturer } from "../utils/manufacturerRules";

function HextomUpload({
  fileName,
  error,
  isParsing,
  summary,
  onFileChange,
  isNewProductMode = false,
  selectedMfgr = null,
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const textureCounts = summary?.productCountByTexture || {};
  const exportableProductCount =
    summary?.exportableProductCount ?? summary?.productCount ?? 0;
  const excludedProductCount = summary?.excludedProductCount ?? 0;
  const isPriceSheet = summary?.inputFormat === "new-product-prices";
  const isBarocka = isBarockaManufacturer(selectedMfgr);
  const priceSheetHeaders = newProductPriceSheetBaseHeaders.map((header) =>
    isBarocka && header === "DP price" ? "NT price" : header,
  );
  const texturePriceLabels = priceSheetHeaders
    .filter((header) => header.endsWith(" price"))
    .join(", ");

  async function copyHeaders(headers, successMessage) {
    const headerText = headers.join("\t");

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(headerText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = headerText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopyStatus(successMessage);
    } catch {
      setCopyStatus("Copy failed");
    }

    window.setTimeout(() => setCopyStatus(""), 1600);
  }

  return (
    <section className="tool-section">
      <h2>{isNewProductMode ? "New Product Price Sheet" : "Hextom Export"}</h2>

      <label className="file-drop">
        <span className="field-label">Upload CSV or XLSX</span>
        <span className="file-help">
          Choose New Product or Add Color before selecting the file. If you
          change the generation type afterward, upload the file again.
        </span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        {isNewProductMode ? (
          <>
            <span className="file-help">
              Use one row per product. Required columns: handle, weight,
              product title, product type, product tags, qty.total, inventory
              quantity, and quickbooks.pID. Every row also needs either a
              generic price or at least one texture price: {texturePriceLabels}.
              Leave unused texture-price cells blank.
            </span>
            <span className="file-help">
              {isBarocka
                ? "For Barocka, a generic price is treated as FT and produces a color label such as Mint - FT. Use NT price for No Texture."
                : "A generic price is treated internally as FT and keeps option values color-only, such as Mint. This is the usual choice for CompX and other non-texture products. An explicit FT price keeps the FT suffix, such as Mint - FT."}{" "}
              Prices export with two decimal places.
            </span>
            <span className="file-help">
              Required values may vary by handle. If a required column has
              exactly one nonblank value in the entire sheet, blank cells
              inherit that shared value; otherwise every row needs its own
              value. Optional columns—option name 1, requires shipping,
              inventory policy, inventory tracking, track quantity, vendor,
              and status—override the matching choices below when supplied.
            </span>
          </>
        ) : (
          <>
            <span className="file-help">
              Upload existing variant rows for one or more handles. Required
              columns: Product handle, Variant price, Variant weight, and
              Option value 1. The aliases Handle, Price, Weight, and Variant
              option 1 value are also accepted.
            </span>
            <span className="file-help">
              Option values ending in - FT, - DT, - DP, or - NT use that texture.
              A nonblank option without a texture suffix is treated as FT.
              {isBarocka
                ? " Barocka option labels always include the texture suffix."
                : " Options without texture suffixes keep a color-only option value. This supports CompX and other non-texture products."}{" "}
              Blank options are unclassified; handles
              with conflicting prices or weights are excluded for review.
            </span>
          </>
        )}
      </label>

      {isNewProductMode && (
        <div className="upload-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              copyHeaders(
                newProductSinglePriceSheetBaseHeaders,
                "Single-price headers copied",
              )
            }
          >
            Copy Single-Price Headers
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              copyHeaders(
                priceSheetHeaders,
                "Texture-price headers copied",
              )
            }
          >
            Copy Texture-Price Headers
          </button>
          {copyStatus && <span className="copy-status">{copyStatus}</span>}
        </div>
      )}

      {isParsing && <p className="empty-state">Parsing export...</p>}

      {fileName && !isParsing && (
        <p className="upload-file-name">Loaded: {fileName}</p>
      )}

      {error && <p className="alert alert--error">{error}</p>}

      {summary && (
        <div className="upload-summary" role="status">
          <p>
            <strong>{summary.productCount}</strong> imported /{" "}
            <strong>{exportableProductCount}</strong> ready /{" "}
            <strong>{excludedProductCount}</strong> excluded from export.
          </p>
          <p className="export-status-detail">
            {isPriceSheet
              ? `${summary.priceSheetRowCount} product price rows / ${summary.parsedRowCount} texture prices parsed.`
              : `${summary.parsedRowCount} export rows parsed.`}
          </p>
          <dl className="summary-grid">
            {textures
              .filter((texture) =>
                texture.code === "NT"
                  ? isBarocka || textureCounts.NT > 0
                  : texture.code !== "DP" || !isBarocka || textureCounts.DP > 0,
              )
              .map((texture) => (
                <div key={texture.code}>
                  <dt>{texture.code}</dt>
                  <dd>{textureCounts[texture.code] || 0}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </section>
  );
}

export default HextomUpload;
