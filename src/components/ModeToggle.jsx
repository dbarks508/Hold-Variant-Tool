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
    </section>
  );
}

export default ModeToggle;
