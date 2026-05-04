function DtBaseColorSelector({
  selectedMfgr,
  selectedColors,
  selectedTextures,
  selectedDtBaseColors,
  setSelectedDtBaseColors,
}) {
  const isAbsolute = selectedMfgr?.code === "absolute";
  const isDtSelected = selectedTextures.some((texture) => texture.code === "DT");

  if (!isAbsolute || !isDtSelected) {
    return null;
  }

  function toggleBaseColor(color) {
    const isSelected = selectedDtBaseColors.some((c) => c.name === color.name);

    if (isSelected) {
      setSelectedDtBaseColors(
        selectedDtBaseColors.filter((c) => c.name !== color.name),
      );
    } else {
      setSelectedDtBaseColors([...selectedDtBaseColors, color]);
    }
  }

  return (
    <section className="tool-section tool-section--accent">
      <h2>Absolute DT Base Colors</h2>

      {selectedColors.length === 0 ? (
        <p className="empty-state">Select colors to choose DT bases.</p>
      ) : (
        <div className="option-grid option-grid--dense">
          {selectedColors.map((color) => (
            <label key={color.name} className="option-row">
              <input
                type="checkbox"
                checked={selectedDtBaseColors.some((c) => c.name === color.name)}
                onChange={() => toggleBaseColor(color)}
              />
              <span>{color.name}</span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

export default DtBaseColorSelector;
