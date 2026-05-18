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
          Full Set
        </button>
        <button
          className={generationMode === "add-color" ? "is-active" : ""}
          type="button"
          onClick={() => setGenerationMode("add-color")}
        >
          Add Color
        </button>
      </div>
    </section>
  );
}

export default GenerationModeToggle;
