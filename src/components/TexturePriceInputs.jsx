function TexturePriceInputs({
  selectedTextures,
  pricesByTexture,
  setPricesByTexture,
}) {
  function updatePrice(textureCode, value) {
    setPricesByTexture({
      ...pricesByTexture,
      [textureCode]: value,
    });
  }

  return (
    <section className="tool-section">
      <h2>Prices</h2>

      {selectedTextures.length === 0 ? (
        <p className="empty-state">Select a texture to enter prices.</p>
      ) : (
        <div className="price-list">
          {selectedTextures.map((texture) => (
            <label key={texture.code} className="price-row">
              <span>
                {texture.label} ({texture.code})
              </span>
              <input
                className="price-input"
                type="text"
                value={pricesByTexture[texture.code] || ""}
                onChange={(e) => updatePrice(texture.code, e.target.value)}
                placeholder="Example: 9.95"
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

export default TexturePriceInputs;
