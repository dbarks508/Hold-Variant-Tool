function ColorSelector({
  colors,
  selectedColors,
  setSelectedColors,
  title = "Colors",
  emptyMessage = "No colors available.",
}) {
  function toggleColor(color) {
    const isSelected = selectedColors.some((c) => c.name === color.name);

    if (isSelected) {
      setSelectedColors(selectedColors.filter((c) => c.name !== color.name));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  }

  return (
    <section className="tool-section">
      <h2>{title}</h2>

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
