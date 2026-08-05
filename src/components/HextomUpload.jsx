function HextomUpload({
  fileName,
  error,
  isParsing,
  summary,
  onFileChange,
  isNewProductMode = false,
}) {
  const textureCounts = summary?.productCountByTexture || {};
  const exportableProductCount =
    summary?.exportableProductCount ?? summary?.productCount ?? 0;
  const excludedProductCount = summary?.excludedProductCount ?? 0;
  const isPriceSheet = summary?.inputFormat === "new-product-prices";

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
            ? "Upload a CSV or XLSX with a handle column and any of these price columns: FT price, DT price, DP price. An optional Weight column overrides Default Weight for that product. Prices export with two decimal places."
            : "Export must include Product handle, Variant price, Variant weight, and Option value 1."}
        </span>
      </label>

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
