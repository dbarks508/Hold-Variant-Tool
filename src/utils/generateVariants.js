export function generateVariants({
  selectedMfgr = null,
  parentSku = "",
  selectedColors = [],
  selectedTextures = [],
  pricesByTexture = {},
}) {
  const variants = [];

  if (!parentSku || !selectedMfgr) {
    return variants;
  }

  function getColorCode(color) {
    return color.codes?.[selectedMfgr.code] || "";
  }

  selectedTextures.forEach((texture) => {
    const price = pricesByTexture[texture.code] || "";

    if (texture.mode === "single") {
      selectedColors.forEach((color) => {
        const colorCode = getColorCode(color);

        if (!colorCode) {
          return;
        }

        variants.push({
          title: `${color.name} - ${texture.code}`,
          mfgr: selectedMfgr.code,
          texture: texture.code,
          color1: color.name,
          color2: "",
          sku: `${parentSku}.${colorCode}`,
          price,
        });
      });
    }

    if (texture.mode === "pair") {
      selectedColors.forEach((color1) => {
        selectedColors.forEach((color2) => {
          const colorCode1 = getColorCode(color1);
          const colorCode2 = getColorCode(color2);

          if (!colorCode1 || !colorCode2) {
            return;
          }

          variants.push({
            title: `${color1.name}/${color2.name} - ${texture.code}`,
            mfgr: selectedMfgr.code,
            texture: texture.code,
            color1: color1.name,
            color2: color2.name,
            sku: `${parentSku}.${colorCode1}/${colorCode2}(${texture.code})`,
            price,
          });
        });
      });
    }
  });

  return variants;
}
