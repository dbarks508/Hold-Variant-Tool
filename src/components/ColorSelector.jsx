function ColorSelector({
  colors,
  selectedColors,
  setSelectedColors,
  title = "Colors",
  emptyMessage = "No colors available.",
}) {
  const allColorsSelected =
    colors.length > 0 &&
    colors.every((color) =>
      selectedColors.some((selectedColor) => selectedColor.name === color.name),
    );

  function toggleColor(color) {
    const isSelected = selectedColors.some((c) => c.name === color.name);

    if (isSelected) {
      setSelectedColors(selectedColors.filter((c) => c.name !== color.name));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  }

  function toggleAllColors() {
    const visibleColorNames = new Set(colors.map((color) => color.name));

    setSelectedColors((currentColors) =>
      allColorsSelected
        ? currentColors.filter((color) => !visibleColorNames.has(color.name))
        : [
            ...currentColors,
            ...colors.filter(
              (color) =>
                !currentColors.some(
                  (currentColor) => currentColor.name === color.name,
                ),
            ),
          ],
    );
  }

  return (
    <section className="tool-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {colors.length > 0 && (
          <button
            type="button"
            className="secondary-button color-select-all-button"
            onClick={toggleAllColors}
          >
            {allColorsSelected ? "Clear all" : "Select all"}
          </button>
        )}
      </div>

      {colors.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="option-grid option-grid--dense">
          {colors.map((color) => (
            <label key={color.name} className="option-row">
              <input
                type="checkbox"
                checked={selectedColors.some((c) => c.name === color.name)}
                onChange={() => toggleColor(color)}
              />
              <span>{color.name}</span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

export default ColorSelector;
