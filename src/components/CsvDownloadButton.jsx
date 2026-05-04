import { exportVariantsToCsv } from "../utils/exportCsv";

function CsvDownloadButton({ variants, parentSku }) {
  const isDisabled = !variants || variants.length === 0;

  return (
    <button
      className="download-button"
      type="button"
      disabled={isDisabled}
      onClick={() => exportVariantsToCsv(variants, parentSku)}
    >
      Download CSV
    </button>
  );
}

export default CsvDownloadButton;
