const FULL_TEXTURE_ONLY_MANUFACTURER_CODES = new Set(["compx", "aragon"]);

export function isFullTextureOnlyManufacturer(manufacturer) {
  return FULL_TEXTURE_ONLY_MANUFACTURER_CODES.has(manufacturer?.code);
}
