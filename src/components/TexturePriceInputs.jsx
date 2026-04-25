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
    <section style={{ marginTop: "1.5rem" }}>
      <h2>Prices</h2>

      {selectedTextures.length === 0 ? (
        <p>Select a texture to enter prices.</p>
      ) : (
        selectedTextures.map((texture) => (
          <label
            key={texture.code}
            style={{
              display: "block",
              marginBottom: "0.75rem",
            }}
          >
            {texture.label} ({texture.code}) Price:
            <input
              type="text"
              value={pricesByTexture[texture.code] || ""}
              onChange={(e) => updatePrice(texture.code, e.target.value)}
              placeholder="Example: 9.95"
              style={{
                marginLeft: "1rem",
                padding: "0.5rem",
                width: "100px",
              }}
            />
          </label>
        ))
      )}
    </section>
  );
}

export default TexturePriceInputs;
