# Wood Volume Requirements

Working requirements for adding wood volumes as a new product type in the Hold Variant Tool. Update this document as requirements are provided.

## Confirmed Requirements

1. Add a new product type: **wood volume**.
2. The manufacturer for the first wood volumes is **Barocka**.
3. Wood volumes should follow the existing behavior in **Single Mode**, **Multi Mode**, **Add Color**, and **New Product**.
4. The textures for **Barocka** wood volumes are **DT**, **FT**, and **NT**. **NT** stands for **No Texture** and should use that label in the texture selector.
5. SKUs include the texture addition **`(DT)`**, **`(FT)`**, or **`(NT)`**, matching the selected texture.
6. Color option labels use **`<color> - <FT/NT/DT>`**, such as **`Black - DT`**. Show the color once in the label, even when the SKU contains a matching color pair.
7. **DT is the only texture whose SKU uses a slash-separated color pair.** Only matching color pairs that produce a solid color are allowed, such as **`black/black`**; mixed color pairs are excluded. **FT and NT SKUs each use a single color code, with no slash.**
8. Selecting **Barocka** in the existing manufacturer selector automatically applies the wood-volume rules, just like other manufacturer-specific rules. No separate product-type selector is needed.
9. **Do not prompt for DT base colors for Barocka**, as with Supr. Each selected color automatically pairs with itself for DT. The separate DT base-color selector remains specific to Absolute and Walltopia; Supr's mixed-color pairing behavior does not apply to Barocka.

## Supplied SKU Examples

Confirmed examples:

- `KWB001.BA111-25(FT)`
- `KWB001.BA111-25/BA111-25(DT)`
- `KWB001.BA111-25(NT)`

`BA111-25` is not in the supplied color table, so these formatting examples do not add a new palette entry.

## Barocka Colors and Codes

Use the **Complete** code as the Barocka color code in generated SKUs. The manufacturer prefix is **BA**.

| WEB Color | MFGR | Variance | Barocka Code | Core | Complete |
| --- | --- | --- | --- | --- | --- |
| White | BA | 0 | RAL 9010 | 12-01 | BA012-01 |
| Yellow | BA | 0 | RAL 1023 | 15-12 | BA015-12 |
| Lime Green | BA | 2 | RAL 6039 | 16-09 | BA216-09 |
| Green | BA | 0 | RAL 6001 | 16-16 | BA016-16 |
| Red | BA | 3 | RAL 3020 | 11-12 | BA311-12 |
| Pink | BA | 2 | RAL 4010 | 11-26 | BA211-26 |
| Orange | BA | 0 | RAL 2004 | 14-01 | BA014-01 |
| Blue | BA | 2 | RAL 5015 | 13-01 | BA213-01 |
| Euro Mint | BA | 1 | RAL 5018 | 13-25 | BA113-25 |
| Mint | BA | 0 | RAL 6027 | 16-27 | BA016-27 |
| Light Gray | BA | 1 | RAL 7040 | 18-12 | BA118-12 |
| Dark Granite | BA | 1 | RAL 7021 | 18-09 | BA118-09 |
| Black | BA | 0 | RAL 9005 | 18-01 | BA018-01 |
| Light Purple | BA | 2 | RAL 4008 | 17-18 | BA217-18 |

## Details to Define

No outstanding clarification questions. Any additional behavior specific to wood volumes will be recorded as requirements are provided.

## Implementation

- Barocka is available in the existing manufacturer selector with the 14 colors above and FT, DT, and NT textures.
- New Product and Add Color use these rules in Single and Multi Mode. Selecting all 14 colors and all three textures generates 42 variants per product.
- Barocka Add Color needs only the new colors; companion colors are not needed because DT pairs always match.
- Hextom uploads recognize `- NT`. New Product price sheets accept `NT price`, `Price NT`, `NT`, or `No Texture price`; the Barocka texture-price header template includes `NT price` in place of `DP price`.
- A generic price continues to mean FT. Barocka color option labels always include the texture suffix, including when the uploaded FT price or option label is implicit.
- Automated coverage is available through `npm test` for generation, imports, exports, and existing manufacturer conventions.
