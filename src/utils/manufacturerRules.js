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
