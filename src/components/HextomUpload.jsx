import { useState } from "react";

import { newProductPriceSheetBaseHeaders } from "../data/newProductExportOptions";

function HextomUpload({
  fileName,
  error,
  isParsing,
  summary,
  onFileChange,
  isNewProductMode = false,
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const textureCounts = summary?.productCountByTexture || {};
  const exportableProductCount =
    summary?.exportableProductCount ?? summary?.productCount ?? 0;
  const excludedProductCount = summary?.excludedProductCount ?? 0;
  const isPriceSheet = summary?.inputFormat === "new-product-prices";

  async function copyBaseHeaders() {
    const headerText = newProductPriceSheetBaseHeaders.join("\t");

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

      setCopyStatus("Copied");
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
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        <span className="file-help">
          {isNewProductMode
            ? "Upload a CSV or XLSX with handle, weight, product title, product type, product tags, qty.total, inventory quantity, quickbooks.pID, and at least one price column: FT price, DT price, or DP price. Prices export with two decimal places."
            : "Export must include Product handle, Variant price, Variant weight, and Option value 1."}
        </span>
        {isNewProductMode && (
          <span className="file-help">
            Weight, product title, product type, product tags, qty.total,
            inventory quantity, and quickbooks.pID are required for every
            handle. Other optional per-product columns override the matching
            New Product choices for that handle. Blank or missing optional
            columns use the choices below. Supported optional columns: option
            name 1, requires shipping, inventory policy, inventory tracking,
            track quantity, vendor, and status.
          </span>
        )}
      </label>

      {isNewProductMode && (
        <div className="upload-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={copyBaseHeaders}
          >
            Copy Base Headers
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
            <div>
              <dt>FT</dt>
              <dd>{textureCounts.FT || 0}</dd>
            </div>
            <div>
              <dt>DT</dt>
              <dd>{textureCounts.DT || 0}</dd>
            </div>
            <div>
              <dt>DP</dt>
              <dd>{textureCounts.DP || 0}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

export default HextomUpload;
