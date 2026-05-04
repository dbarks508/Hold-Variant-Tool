export function generateVariants({
  selectedMfgr = null,
  parentSku = "",
  selectedColors = [],
  selectedTextures = [],
  pricesByTexture = {},
  selectedDtBaseColors = [],
}) {
  const variants = [];

  if (!parentSku || !selectedMfgr) {
    return variants;
  }

  function getColorCode(color) {
    return color.codes?.[selectedMfgr.code] || "";
  }

  function formatColorName(color) {
    return color.name.charAt(0).toUpperCase() + color.name.slice(1);
  }

  function formatSku(sku) {
    return sku.toUpperCase();
  }

  selectedTextures.forEach((texture) => {
    if (selectedMfgr.code === "compx" && texture.code !== "FT") {
      return;
    }

    const price = pricesByTexture[texture.code] || "";

    if (texture.mode === "single") {
      selectedColors.forEach((color) => {
        const colorCode = getColorCode(color);

        if (!colorCode) {
          return;
        }

        variants.push({
          title: `${formatColorName(color)} - ${texture.code}`,
          mfgr: selectedMfgr.code,
          texture: texture.code,
          color1: formatColorName(color),
          color2: "",
          sku: formatSku(`${parentSku}.${colorCode}`),
          price,
        });
      });
    }

    if (texture.mode === "pair" && texture.code === "DP") {
      selectedColors.forEach((color1) => {
        selectedColors.forEach((color2) => {
          const colorCode1 = getColorCode(color1);
          const colorCode2 = getColorCode(color2);

          if (!colorCode1 || !colorCode2) {
            return;
          }

          variants.push({
            title: `${formatColorName(color1)}/${formatColorName(color2)} - ${
              texture.code
            }`,
            mfgr: selectedMfgr.code,
            texture: texture.code,
            color1: formatColorName(color1),
            color2: formatColorName(color2),
            sku: formatSku(
              `${parentSku}.${colorCode1}/${colorCode2}(${texture.code})`,
            ),
            price,
          });
        });
      });
    }

    if (texture.mode === "pair" && texture.code === "DT") {
      const baseColors =
        selectedMfgr.code === "absolute" ? selectedDtBaseColors : selectedColors;

      baseColors.forEach((baseColor) => {
        selectedColors.forEach((insetColor) => {
          const baseColorCode = getColorCode(baseColor);
          const insetColorCode = getColorCode(insetColor);

          if (!baseColorCode || !insetColorCode) {
            return;
          }

          variants.push({
            title: `${formatColorName(baseColor)}/${formatColorName(
              insetColor,
            )} - ${texture.code}`,
            mfgr: selectedMfgr.code,
            texture: texture.code,
            color1: formatColorName(baseColor),
            color2: formatColorName(insetColor),
            sku: formatSku(
              `${parentSku}.${baseColorCode}/${insetColorCode}(${texture.code})`,
            ),
            price,
          });
        });
      });
    }
  });

  return variants;
}
