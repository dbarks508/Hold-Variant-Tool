function GenerationModeToggle({ generationMode, setGenerationMode }) {
  return (
    <section className="tool-section">
      <h2>Generation</h2>

      <div
        className="segmented-control"
        role="group"
        aria-label="Generation mode"
      >
        <button
          className={generationMode === "full" ? "is-active" : ""}
          type="button"
          onClick={() => setGenerationMode("full")}
        >
          New Product
        </button>
        <button
          className={generationMode === "add-color" ? "is-active" : ""}
          type="button"
          onClick={() => setGenerationMode("add-color")}
        >
          Add Color
        </button>
      </div>

      <p className="file-help">
        {generationMode === "full"
          ? "New Product creates complete product and variant import rows."
          : "Add Color creates only new variant rows for products that already exist."}
      </p>
    </section>
  );
}

export default GenerationModeToggle;
