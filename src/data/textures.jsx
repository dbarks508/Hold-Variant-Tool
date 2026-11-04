export const textures = [
  {
    code: "FT",
    label: "Full Texture",
    mode: "single",
  },
  {
    code: "DT",
    label: "Dual Tex",
    mode: "pair",
  },
  {
    code: "DP",
    label: "Dual-Tex Premium",
    mode: "pair",
  },
  {
    code: "NT",
    label: "No Texture",
    mode: "single",
  },
];

export const textureOrder = textures.map((texture) => texture.code);
