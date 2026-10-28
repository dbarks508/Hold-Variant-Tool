import { requiresDtBaseColorSelection } from "../utils/manufacturerRules";

function DtBaseColorSelector({
  selectedMfgr,
  selectedColors,
  selectedTextures,
  selectedDtBaseColors,
  setSelectedDtBaseColors,
  colorOptions = selectedColors,
  emptyMessage = "Select colors to choose DT bases.",
}) {
  const isDtSelected = selectedTextures.some((texture) => texture.code === "DT");

  if (!requiresDtBaseColorSelection(selectedMfgr) || !isDtSelected) {
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
      <h2>{selectedMfgr.label} DT Base Colors</h2>

      {colorOptions.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="option-grid option-grid--dense">
          {colorOptions.map((color) => (
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
