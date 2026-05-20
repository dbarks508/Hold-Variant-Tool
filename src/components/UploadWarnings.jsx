import { useState } from "react";

function getWarningRows(warning) {
  return [...warning.rows].sort((rowA, rowB) => {
    const productA = `${rowA.handle}-${rowA.texture}`;
    const productB = `${rowB.handle}-${rowB.texture}`;

    if (productA !== productB) {
      return productA.localeCompare(productB);
    }

    if (rowA.priceWarningRole !== rowB.priceWarningRole) {
      return rowA.priceWarningRole === "used" ? -1 : 1;
    }

    return rowA.rowNumber - rowB.rowNumber;
  });
}

function formatCopyValue(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").replace(/\t/g, " ");
}

function buildCopyText(warning) {
  const rows = [...(warning.copyRows || warning.rows)]
    .filter((row) => row.originalRow)
    .sort((rowA, rowB) => rowA.rowNumber - rowB.rowNumber);
  const headers =
    warning.originalHeaders?.length > 0
      ? warning.originalHeaders
      : [
          ...new Set(
            rows.flatMap((row) => Object.keys(row.originalRow || {})),
          ),
        ];

  return [headers, ...rows.map((row) => headers.map((header) => row.originalRow[header]))]
    .map((row) => row.map(formatCopyValue).join("\t"))
    .join("\n");
}

function buildAllCopyText(warnings) {
  return warnings
    .map((warning) => buildCopyText(warning))
    .filter(Boolean)
    .join("\n\n");
}

async function copyText(text) {
  if (!text) {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  try {
    if (document.execCommand("copy")) {
      document.body.removeChild(textArea);
      return true;
    }
  } catch {
    // Try the async clipboard API below.
  }

  document.body.removeChild(textArea);

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function UploadWarnings({ warnings = [] }) {
  const [openWarning, setOpenWarning] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  if (warnings.length === 0) {
    return null;
  }

  async function copyAllWarnings() {
    const didCopy = await copyText(buildAllCopyText(warnings));

    setCopyStatus(didCopy ? "Copied" : "Copy failed");
    window.setTimeout(() => setCopyStatus(""), 1600);
  }

  return (
    <section className="tool-section tool-section--warning">
      <div className="review-heading">
        <h2>Upload Review</h2>
        <button
          className="secondary-button warning-copy-button"
          type="button"
          aria-label="Copy upload review rows"
          title={copyStatus || "Copy review rows"}
          onClick={copyAllWarnings}
        >
          <svg
            aria-hidden="true"
            className="warning-copy-icon"
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect x="9" y="9" width="10" height="10" rx="2" />
            <path d="M5 15V7a2 2 0 0 1 2-2h8" />
          </svg>
        </button>
        {copyStatus && <span className="copy-status">{copyStatus}</span>}
      </div>

      <div className="warning-list">
        {warnings.map((warning, index) => {
          const isOpen = openWarning === index;
          const handles = warning.handles.length
            ? warning.handles.join(", ")
            : "Rows without handles";
          const warningRows = getWarningRows(warning);
          const summaryText =
            warning.type === "price-conflict"
              ? `${warning.handles.length} price conflict groups`
              : warning.type === "price-suggestion"
                ? `${warning.handles.length} products to review`
              : handles;

          return (
            <div className="warning-item" key={`${warning.type}-${index}`}>
              <button
                className="warning-summary"
                type="button"
                onClick={() => setOpenWarning(isOpen ? null : index)}
              >
                <span>{warning.label}</span>
                <strong>{summaryText}</strong>
              </button>

              {isOpen && (
                <div className="warning-details">
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Handle</th>
                        <th>Texture</th>
                        <th>Price</th>
                        <th>Weight</th>
                        <th>Option value 1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warningRows.map((row, rowIndex) => {
                        const isPriceConflict =
                          warning.type === "price-conflict" &&
                          row.priceWarningRole === "conflict";
                        const isUsedPrice =
                          warning.type === "price-conflict" &&
                          row.priceWarningRole === "used";

                        return (
                          <tr
                            className={
                              isPriceConflict ? "warning-row--conflict" : ""
                            }
                            key={`${row.rowNumber}-${row.handle}-${row.optionValue}-${rowIndex}`}
                          >
                            <td>{row.rowNumber}</td>
                            <td>{row.handle}</td>
                            <td>{row.texture || "Unclassified"}</td>
                            <td
                              className={
                                isPriceConflict
                                  ? "warning-price warning-price--conflict"
                                  : isUsedPrice
                                    ? "warning-price warning-price--used"
                                    : ""
                              }
                            >
                              {row.price}
                              {isPriceConflict && (
                                <span>Used: {row.referencePrice}</span>
                              )}
                              {row.expectedPrice && (
                                <span>
                                  Suggestion: {row.expectedPrice} from FT math
                                </span>
                              )}
                              {row.issueDetail && <span>{row.issueDetail}</span>}
                              {isUsedPrice && <span>Used price</span>}
                            </td>
                            <td>{row.weight}</td>
                            <td>{row.optionValue}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default UploadWarnings;

