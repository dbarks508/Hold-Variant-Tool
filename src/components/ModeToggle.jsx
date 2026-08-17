function ModeToggle({ mode, setMode }) {
  return (
    <section className="tool-section">
      <h2>Mode</h2>

      <div className="segmented-control" role="group" aria-label="Variant mode">
        <button
          className={mode === "single" ? "is-active" : ""}
          type="button"
          onClick={() => setMode("single")}
        >
          Single Mode
        </button>
        <button
          className={mode === "multi" ? "is-active" : ""}
          type="button"
          onClick={() => setMode("multi")}
        >
          Multi Mode
        </button>
      </div>

      <p className="file-help">
        {mode === "single"
          ? "Single Mode creates variants for one handle using the fields below; no upload is needed."
          : "Multi Mode creates variants for many handles from one CSV or XLSX upload."}
      </p>
    </section>
  );
}

export default ModeToggle;
