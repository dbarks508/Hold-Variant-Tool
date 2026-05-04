function WeightInput({ weight, setWeight }) {
  return (
    <section className="tool-section">
      <label className="field">
        <span className="field-label">Weight</span>
        <input
          className="text-input"
          type="text"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Example: 1.25"
        />
      </label>
    </section>
  );
}

export default WeightInput;
