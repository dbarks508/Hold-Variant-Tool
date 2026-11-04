const FULL_TEXTURE_ONLY_MANUFACTURER_CODES = new Set(["compx", "aragon"]);
const DT_BASE_COLOR_SELECTION_MANUFACTURER_CODES = new Set([
  "absolute",
  "walltopia",
]);

export function isFullTextureOnlyManufacturer(manufacturer) {
  return FULL_TEXTURE_ONLY_MANUFACTURER_CODES.has(manufacturer?.code);
}

export function requiresDtBaseColorSelection(manufacturer) {
  return DT_BASE_COLOR_SELECTION_MANUFACTURER_CODES.has(manufacturer?.code);
}

export function isBarockaManufacturer(manufacturer) {
  return manufacturer?.code === "barocka";
}

export function isTextureSupported(manufacturer, textureCode) {
  if (isBarockaManufacturer(manufacturer)) {
    return ["FT", "DT", "NT"].includes(textureCode);
  }

  if (isFullTextureOnlyManufacturer(manufacturer)) {
    return textureCode === "FT";
  }

  return ["FT", "DT", "DP"].includes(textureCode);
}
