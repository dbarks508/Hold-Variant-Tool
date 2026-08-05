function WeightInput({
  weight,
  setWeight,
  label = "Weight",
  helpText = "",
}) {
  return (
    <section className="tool-section">
      <label className="field">
        <span className="field-label">{label}</span>
        <input
          className="text-input"
          type="text"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Example: 1.25"
        />
        {helpText && <span className="file-help">{helpText}</span>}
      </label>
    </section>
  );
}

export default WeightInput;
