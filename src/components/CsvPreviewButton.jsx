import { useState } from "react";

import { getVariantCsvRows } from "../utils/exportCsv";

const csvHeaders = [
  "handle",
  "option value 1",
  "variant sku",
  "variant price",
  "weight",
  "inventory policy",
  "inventory tracking",
];

function CsvPreviewButton({ variants, parentSku }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDisabled = !variants || variants.length === 0;
  const rows = getVariantCsvRows(variants, parentSku);

  return (
    <>
      <button
        className="secondary-button"
        type="button"
        disabled={isDisabled}
        onClick={() => setIsOpen(true)}
      >
        Preview CSV
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="csv-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <h2>CSV Preview</h2>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="csv-grid-wrap">
              <table className="csv-grid">
                <thead>
                  <tr>
                    {csvHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={`${row["variant sku"]}-${rowIndex}`}>
                      {csvHeaders.map((header) => (
                        <td key={header}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CsvPreviewButton;
