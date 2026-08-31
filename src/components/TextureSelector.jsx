import { isFullTextureOnlyManufacturer } from "../utils/manufacturerRules";

function TextureSelector({
  textures,
  selectedTextures,
  setSelectedTextures,
  selectedMfgr,
}) {
  function toggleTexture(texture) {
    if (
      isFullTextureOnlyManufacturer(selectedMfgr) &&
      texture.code !== "FT"
    ) {
      return;
    }

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
    <section className="tool-section">
      <h2>Textures</h2>

      <div className="option-grid">
        {textures.map((texture) => {
          const isDisabled =
            isFullTextureOnlyManufacturer(selectedMfgr) &&
            texture.code !== "FT";

          return (
            <label
              key={texture.code}
              className={`option-row ${isDisabled ? "is-disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedTextures.some((t) => t.code === texture.code)}
                disabled={isDisabled}
                onChange={() => toggleTexture(texture)}
              />
              <span>{texture.label} ({texture.code})</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default TextureSelector;
