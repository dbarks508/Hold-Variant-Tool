function TextureSelector({ textures, selectedTextures, setSelectedTextures }) {
  function toggleTexture(texture) {
    const isSelected = selectedTextures.some((t) => t.code === texture.code);

    if (isSelected) {
      setSelectedTextures(
        selectedTextures.filter((t) => t.code !== texture.code),
      );
    } else {
      setSelectedTextures([...selectedTextures, texture]);
    }
  }

  return (
    <section>
      <h2>Textures</h2>

      {textures.map((texture) => (
        <label key={texture.code} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={selectedTextures.some((t) => t.code === texture.code)}
            onChange={() => toggleTexture(texture)}
          />
          {texture.label} ({texture.code})
        </label>
      ))}
    </section>
  );
}

export default TextureSelector;
