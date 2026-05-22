function getUniqueColors(colors = []) {
  const seenNames = new Set();

  return colors.filter((color) => {
    if (seenNames.has(color.name)) {
      return false;
    }

    seenNames.add(color.name);
    return true;
  });
}

function isSameColor(colorA, colorB) {
  return colorA.name === colorB.name;
}

export function generateVariants({
  selectedMfgr = null,
  parentSku = "",
  selectedColors = [],
  selectedTextures = [],
  pricesByTexture = {},
  selectedDtBaseColors = [],
  generationMode = "full",
  selectedNewColors = [],
  selectedExistingColors = [],
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

  function addSingleVariant(color, texture, price) {
    const colorCode = getColorCode(color);

    if (!colorCode) {
      return;
    }

    const usesFullTextureSuffix = ["absolute", "supr"].includes(
      selectedMfgr.code,
    );
    const textureSuffix =
      usesFullTextureSuffix && texture.code === "FT" ? `(${texture.code})` : "";

    variants.push({
      title: `${formatColorName(color)} - ${texture.code}`,
      mfgr: selectedMfgr.code,
      texture: texture.code,
      color1: formatColorName(color),
      color2: "",
      sku: formatSku(`${parentSku}.${colorCode}${textureSuffix}`),
      price,
    });
  }

  function addPairVariant(color1, color2, texture, price) {
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
  }

  function hasNewColorPair(color1, color2, newColors) {
    return newColors.some(
      (newColor) => isSameColor(newColor, color1) || isSameColor(newColor, color2),
    );
  }

  function addNewColorOrderedPairs(pairColors, newColors, texture, price) {
    pairColors.forEach((color1) => {
      pairColors.forEach((color2) => {
        if (hasNewColorPair(color1, color2, newColors)) {
          addPairVariant(color1, color2, texture, price);
        }
      });
    });
  }

  selectedTextures.forEach((texture) => {
    if (selectedMfgr.code === "compx" && texture.code !== "FT") {
      return;
    }

    const price = pricesByTexture[texture.code] || "";
    const isAddColorMode = generationMode === "add-color";
    const newColors = isAddColorMode ? selectedNewColors : selectedColors;
    const existingColors = isAddColorMode ? selectedExistingColors : [];
    const pairColors = isAddColorMode
      ? getUniqueColors([...existingColors, ...newColors])
      : selectedColors;

    if (texture.mode === "single") {
      newColors.forEach((color) => addSingleVariant(color, texture, price));
    }

    if (texture.mode === "pair" && texture.code === "DP") {
      if (isAddColorMode) {
        addNewColorOrderedPairs(pairColors, newColors, texture, price);
      } else {
        selectedColors.forEach((color1) => {
          selectedColors.forEach((color2) => {
            addPairVariant(color1, color2, texture, price);
          });
        });
      }
    }

    if (texture.mode === "pair" && texture.code === "DT") {
      if (isAddColorMode && selectedMfgr.code === "supr") {
        addNewColorOrderedPairs(pairColors, newColors, texture, price);
        return;
      }

      const baseColors =
        selectedMfgr.code === "absolute" ? selectedDtBaseColors : pairColors;
      const insetColors = isAddColorMode ? newColors : selectedColors;

      baseColors.forEach((baseColor) => {
        insetColors.forEach((insetColor) => {
          addPairVariant(baseColor, insetColor, texture, price);
        });
      });
    }
  });

  return variants;
}
