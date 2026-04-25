function ColorSelector({ colors, selectedColors, setSelectedColors, mfgr }) {
  function toggleColor(color) {
    const isSelected = selectedColors.some((c) => c.name === color.name);

    if (isSelected) {
      setSelectedColors(selectedColors.filter((c) => c.name !== color.name));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  }

  return (
    <section>
      <h2>Colors</h2>

      {colors.map((color) => (
        <label key={color.name} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={selectedColors.some((c) => c.name === color.name)}
            onChange={() => toggleColor(color)}
          />
          {color.name}
        </label>
      ))}
    </section>
  );
}

export default ColorSelector;
