import { useState } from "react";

function getWarningRows(warning) {
  if (warning.type !== "price-conflict") {
    return warning.rows;
  }

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

function UploadWarnings({ warnings = [] }) {
  const [openWarning, setOpenWarning] = useState(null);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="tool-section tool-section--warning">
      <h2>Upload Warnings</h2>

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
                      {warningRows.map((row) => {
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
                            key={`${row.rowNumber}-${row.handle}-${row.optionValue}`}
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
                                  Guide: {row.expectedPrice} from FT math
                                </span>
                              )}
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

