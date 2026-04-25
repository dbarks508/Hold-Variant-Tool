import { exportVariantsToCsv } from "../utils/exportCsv";

function CsvDownloadButton({ variants, parentSku }) {
  const isDisabled = !variants || variants.length === 0;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => exportVariantsToCsv(variants, parentSku)}
      style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      Download CSV
    </button>
  );
}

export default CsvDownloadButton;
