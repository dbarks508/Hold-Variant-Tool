function MfgrSelector({ manufacturers, selectedMfgr, setSelectedMfgr }) {
  return (
    <section className="tool-section">
      <h2>Manufacturer</h2>

      <div className="option-grid">
        {manufacturers.map((mfgr) => (
          <label key={mfgr.code} className="option-row">
            <input
              type="radio"
              name="manufacturer"
              checked={selectedMfgr?.code === mfgr.code}
              onChange={() => setSelectedMfgr(mfgr)}
            />
            <span>{mfgr.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export default MfgrSelector;
