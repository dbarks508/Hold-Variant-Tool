function MfgrSelector({ manufacturers, selectedMfgr, setSelectedMfgr }) {
  return (
    <section>
      <h2>Manufacturer</h2>

      {manufacturers.map((mfgr) => (
        <label key={mfgr.code} style={{ display: "block" }}>
          <input
            type="radio"
            name="manufacturer"
            checked={selectedMfgr?.code === mfgr.code}
            onChange={() => setSelectedMfgr(mfgr)}
          />
          {mfgr.label}
        </label>
      ))}
    </section>
  );
}

export default MfgrSelector;
