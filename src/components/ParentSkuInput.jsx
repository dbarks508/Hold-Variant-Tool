function ParentSkuInput({ parentSku, setParentSku }) {
  return (
    <section className="tool-section">
      <label className="field">
        <span className="field-label">Parent SKU</span>
        <input
          className="text-input"
          type="text"
          value={parentSku}
          onChange={(e) => setParentSku(e.target.value)}
          placeholder="Example: kx123"
        />
      </label>
    </section>
  );
}

export default ParentSkuInput;
