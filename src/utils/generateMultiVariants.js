import { generateVariants } from "./generateVariants.js";

const TEXTURE_ORDER = ["FT", "DT", "DP"];

function getTextureByCode(textures, code) {
  return textures.find((texture) => texture.code === code);
}

export function getDetectedTextures(groups = [], textures = []) {
  const detectedCodes = [...new Set(groups.map((group) => group.texture))];

  return TEXTURE_ORDER.filter((code) => detectedCodes.includes(code))
    .map((code) => getTextureByCode(textures, code))
    .filter(Boolean);
}

export function generateMultiVariants({
  groups = [],
  textures = [],
  selectedMfgr = null,
  selectedColors = [],
  selectedDtBaseColors = [],
  generationMode = "full",
  selectedNewColors = [],
  selectedExistingColors = [],
}) {
  if (!selectedMfgr) {
    return [];
  }

  return groups.flatMap((group) => {
    if (group.excluded) {
      return [];
    }

    const texture = getTextureByCode(textures, group.texture);

    if (!texture) {
      return [];
    }

    return generateVariants({
      selectedMfgr,
      parentSku: group.handle,
      selectedColors,
      selectedTextures: [texture],
      pricesByTexture: {
        [texture.code]: group.price,
      },
      selectedDtBaseColors,
      generationMode,
      selectedNewColors,
      selectedExistingColors,
    }).map((variant) => ({
      ...variant,
      handle: group.handle,
      weight: group.weight || undefined,
      newProductExportValues: group.newProductExportValues || {},
    }));
  });
}

