# Hold Variant Tool Change Blueprint

This document is the working blueprint for upcoming larger changes to the Hold Variant Tool. Use it to define scope, decisions, implementation order, and verification before editing application code.

## Current App Shape

- `src/App.jsx` owns the main workflow state and composes the setup and preview panels.
- `src/components/` contains focused inputs, selectors, preview, and CSV action controls.
- `src/data/` contains static domain lists such as manufacturers, colors, and textures.
- `src/utils/generateVariants` builds the generated variant data from selected options.
- Styling is currently centered in `src/App.css` and global styles in `src/index.css`.

## Current Single Mode Workflow

1. Enter a parent SKU.
2. Select manufacturer.
3. Select colors.
4. Select textures.
5. Optionally select DT base colors when applicable.
6. Enter texture-specific prices.
7. Enter weight.
8. Configure inventory export options.
9. Preview generated variants.
10. Preview or download CSV output.

## Projects

### Multiple Handle Variant Creation

#### Goal

Add a mode switch between the current single-handle workflow and a new multi-handle workflow that can generate variants for many Shopify product handles from one Hextom export.

#### Primary Workflow

1. User toggles from `Single Mode` to `Multi Mode`.
2. User uploads a direct Hextom export from Shopify.
3. The app parses product handle, current variant price, variant weight, and `Option value 1`.
4. The app classifies each row as `DT`, `FT`, or `DP` by reading `Option value 1`.
5. The app collapses repeated rows from the Hextom export into product records.
6. User selects shared options such as manufacturer, colors, DT base colors, and inventory settings.
7. The app generates variants for all parsed products.
8. The preview shows product count, variants per product, warnings, and export totals.
9. User can preview, copy, or download CSV output.

#### Hextom Upload Requirements

The planned primary input is a single Hextom export file with these columns:

- `Product handle`
- `Variant price`
- `Variant weight`
- `Option value 1` or Hextom's `Variant option 1 value`

Accepted header aliases:

- Product handle: `Product handle` or `Handle`
- Variant price: `Variant price` or `Price`
- Variant weight: `Variant weight` or `Weight`
- Option value: `Option value 1` or `Variant option 1 value`

Texture detection:

- Option value column containing `- DT` is classified as `DT`.
- Option value column containing `- FT` is classified as `FT`.
- Option value column containing `- DP` is classified as `DP`.

The UI should message that Hextom exports one row per existing variant, so repeated rows are normal, and that the option value column is required for one-file texture detection.

#### Sample Export Notes

Source sample inspected: `c:\Users\dylan\Downloads\absolute_hex.xlsx`

- File type: `.xlsx`
- Sheet count: 1
- Sheet name: `Sheet1`
- Existing sample columns:
  - `Product handle`
  - `Variant price`
  - `Variant weight`
- Needed additional column:
  - `Option value 1` or `Variant option 1 value`
- Sample row:
  - Product handle: `upva007-1`
  - Variant price: `102.96`
  - Variant weight: `1`
- Sample file size:
  - 8,529 total rows including header.
  - 8,528 data rows.
  - 194 unique handles.
  - 266 unique handle/price/weight records.
  - 72 handles have more than one price/weight combo.
- Observed duplicate pattern:
  - Many rows repeat the same handle, price, and weight because the export includes one row per existing variant.
  - Some handles have one-cent price differences while weight remains the same, for example `184.74 / 1` and `184.75 / 1`.

#### Multi Mode Data Rules

- Collapse exact duplicate source Hextom rows for the same handle, texture, price, and weight before generation.
- Do not collapse generated variants; every selected color/texture/base combination still needs to create its expected variant row.
- Detect same-handle conflicts within each texture group.
- Warn and continue when rows cannot be classified; users can add those manually in Single Mode if needed.
- Ignore price differences under 5 cents within the same handle/texture group.
- Treat price differences of 5 cents or more as conflicts.
- When an ignored under-5-cent price difference is found, use the first price encountered in that texture group.
- Use uploaded price as the base/current variant price in Multi Mode.
- For Absolute Multi Mode products with an FT price, use texture price math only as a guide inside existing price conflicts: `DT = FT * 1.1` and `DP = FT * 1.3`. Do not create warnings solely because a price differs from the formula, and do not calculate generated export prices from the formula.
- Use uploaded weight as the product weight in Multi Mode.
- Most DP and FT rows are expected to have `1` lb weight.
- If weight varies within the same handle/texture group, warn and ignore weight for that product/texture output.
- Treat uploaded product fields as product-specific values.
- Treat UI selections as shared values applied across all parsed products.

#### Multi Mode UI Rules

- Add a visible `Single Mode` / `Multi Mode` toggle.
- Hide the single parent SKU input in Multi Mode.
- Hide manual texture price inputs in Multi Mode.
- Hide the global weight input in Multi Mode.
- Keep manufacturer, color, DT base color, inventory, preview, copy, and CSV controls available as applicable.
- Always show an upload summary with detected product count, parsed row count, duplicate row count, product count by texture, conflicts, and unclassified row count.
- Display should communicate `products`, `variants/product`, and total generated variants so the user can confirm the upload matches their export.
- Render only the first product in the generated variants table by default, then let users reveal 4 additional products at a time. Copy, CSV preview, and CSV download still operate on the full generated export.
- Warnings should help users identify products they may need to handle manually in Single Mode.

#### Existing Option Behavior In Multi Mode

The upload does not replace the existing option selectors.

- Existing color selection remains the way users choose which color variants to create for every uploaded product.
- Existing DT base color selection remains the way users choose base color behavior for DT variants.
- Existing manufacturer rules still need to apply.
- Existing inventory export options still apply to generated rows.
- Existing CSV preview, download, and copy actions still apply.

Product-specific fields from upload:

- Product handle.
- Base/current variant price.
- Detected texture group from `Option value 1`.
- Weight, unless it varies within the same handle/texture group.

Shared fields from UI:

- Manufacturer.
- Colors.
- DT base colors, when DT applies.
- Inventory policy/tracking options.

#### Mode Switching

- Switching between Single Mode and Multi Mode should preserve each mode's state.
- Multi Mode upload, parsed rows, warnings, and generated export data should remain available when the user switches to Single Mode and back.
- Single Mode inputs and selections should remain available when the user switches to Multi Mode and back.
- Users may switch to Single Mode to manually add variants for products flagged with Multi Mode issues.

#### Implementation Notes

- Consider introducing explicit `mode`, `singleModeState`, and `multiModeState` instead of stretching `parentSku` state.
- Add a parser utility for uploaded Hextom exports so header detection, texture classification, deduplication, and conflict detection are testable outside the UI.
- Support both `.xlsx` and `.csv` Hextom uploads.
- If supporting `.xlsx`, use a browser-side spreadsheet parser such as SheetJS/xlsx.
- Multi Mode variant generation likely needs a wrapper that generates variants per parsed product/texture group.
- Preview and CSV components may need to accept grouped product/variant data or derived summary counts.
- Keep heavy preview work demand-driven where possible, especially for large Multi Mode uploads.

#### Open Questions

Recommended defaults unless decided otherwise:

- Texture detection should be case-insensitive.
- Extra upload columns should be ignored as long as required headers are present.
- Multi Mode preview should regenerate from current uploaded data and current shared selectors whenever inputs change, including after toggling modes.

Still unclear:

- Size warning wording: what exact message should be shown with the detected product count?

Warning detail decision:

- Warnings should show affected handles first.
- Users should be able to pop out/inspect a warning for row-level details when needed.

#### Deferred Ideas

- Consider a quick action that copies a flagged product handle for manual Single Mode work.


### Add Color Expansion Mode

#### Goal

Add a generation mode for adding one or more new colors to an existing product family without regenerating every existing color combination.

This is intended for launches like adding `Signal Violet` / `Light Purple` across existing Absolute products where only variants containing the new color should be exported.

#### Primary Workflow

1. User chooses `Add Color` generation mode.
2. User selects the new color or colors being added, such as `Signal Violet`.
3. User selects the existing companion colors already available in the product family.
4. User selects DT base colors from the full color list, not only from the new colors.
5. The app generates only the new variants created by working the new color into the existing FT, DT, and DP rules.
6. User previews, copies, or downloads the generated CSV.

#### Add Color Data Rules

- New colors are treated as the colors being introduced to the product family.
- Existing companion colors are treated as colors already present and available for pairing.
- DT base colors must be selectable from all valid colors, because the new color may be an inset color while the base comes from an existing color.
- FT generation creates one single-color variant per new color.
- DT generation creates one variant for each selected DT base color paired with each new inset color.
- DP generation creates ordered pairs where at least one side is a new color.
- DP generation should include the new-color self pair once, for example `Signal Violet/Signal Violet - DP`.
- DP generation should not export existing-color/existing-color pairs in Add Color mode.

#### Signal Violet Example

Using the Absolute color list:

| Color | Mfgr | Group | Short Code | Full Code |
| --- | --- | --- | --- | --- |
| Red | AB | 1 | 11-12 | AB111-12 |
| Orange | AB | 1 | 14-01 | AB114-01 |
| Yellow | AB | 1 | 15-12 | AB115-12 |
| Green | AB | 1 | 16-16 | AB116-16 |
| Blue | AB | 2 | 13-01 | AB213-01 |
| Purple | AB | 2 | 07-13 | AB207-13 |
| Pink | AB | 2 | 11-26 | AB211-26 |
| Black | AB | 0 | 18-01 | AB018-01 |
| White | AB | 1 | 12-01 | AB112-01 |
| Lime Green | AB | 1 | 16-09 | AB116-09 |
| Mint | AB | 0 | 16-27 | AB016-27 |
| Signal Violet | AB | 3 | 17-18 | AB317-18 |

Expected new variants for adding one new color:

- FT: 1 new variant, `Signal Violet - FT`.
- DT: 4 new variants when 4 DT base colors are selected, each base paired with `Signal Violet` as the inset/new color.
- DP: 23 new variants with 12 total colors, because ordered pairs are `Signal Violet` with every color plus every color with `Signal Violet`, with `Signal Violet/Signal Violet` included only once.

Formula for one new DP color:

`total colors + total colors - 1 = new DP variants`

For Signal Violet:

`12 + 12 - 1 = 23`

#### UI Notes

- Add Color mode should make the distinction between `New colors`, `Existing companion colors`, and `DT base colors` clear.
- The current DT base selector is tied to selected colors; Add Color mode needs DT base selection to draw from all valid colors instead.
- The preview summary should communicate that the export contains only new-color additions, not a full regenerated product set.

#### Verification Checklist

- FT generates only the new color variants.
- DT base choices can include existing colors even when those colors are not selected as new colors.
- DT generates base/new-color combinations according to the selected DT bases.
- DP includes all ordered pairs where either side is a new color.
- DP includes the new-color/new-color pair once.
- DP excludes existing-color/existing-color pairs.
- Multi Mode upload fields still supply handle, texture, price, and weight for Add Color output.

## Implementation Plan

1. Confirm Add Color Expansion Mode rules and DT base-color defaults.
2. Add mode state and preserve separate Single/Multi Mode state.
3. Add Hextom upload parser for required headers and `Option value 1` texture detection.
4. Add deduplication, conflict detection, and warning summary logic.
5. Update variant generation to support parsed multi-product inputs.
6. Update preview/copy/download components for Multi Mode output grouped by product.
7. Update UI to hide price/weight inputs in Multi Mode and show upload/status panels.
8. Verify Single Mode still behaves exactly as before.
9. Verify Multi Mode upload, warnings, preview, copy, and CSV output.
10. Add Add Color Expansion Mode.
11. Verify FT, DT, and DP Add Color counts against the Signal Violet example.

## Verification Checklist

- App starts successfully.
- Lint/build passes.
- Single Mode variant generation still works.
- Single Mode state survives toggling to Multi Mode and back.
- Multi Mode upload parses required Hextom headers.
- Multi Mode classifies `DT`, `FT`, and `DP` from `Option value 1`.
- Duplicate Hextom rows collapse correctly.
- Conflict and unclassified-row warnings appear.
- Under-5-cent price differences within the same handle/texture use the first encountered price.
- Price differences of 5 cents or more within the same handle/texture are conflicts.
- Varying weights within the same handle/texture warn and are ignored for that product/texture output.
- Multi Mode CSV output is grouped by product.
- Multi Mode exports the whole uploaded file's detected groups together.
- Absolute Multi Mode shows DT/DP formula guidance only when an uploaded price conflict already exists.
- Multi Mode state survives toggling to Single Mode and back without requiring re-upload.
- CSV preview matches CSV download/copy.
- Generated variants table starts with one product and reveals additional products in 4-product chunks.
- Manufacturer-specific rules still apply.
- DT base color behavior still applies when DT variants are generated.
- Layout remains usable on narrow and wide screens.

## Decision Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-05-14 | Created blueprint before implementation changes. | Larger changes need a shared plan before code edits. |
| 2026-05-14 | Multi Mode should use Hextom upload as the primary input. | Upload avoids fragile manual paste workflows. |
| 2026-05-14 | Multi Mode should prefer one-file parsing with `Option value 1`. | One upload can classify `DT`, `FT`, and `DP` rows when option values are reliable. |
| 2026-05-14 | Manual price and weight inputs are hidden in Multi Mode. | Price and weight come from uploaded Hextom data. |
| 2026-05-14 | Support both `.xlsx` and `.csv` uploads. | Hextom/spreadsheet exports may be available in either format. |
| 2026-05-14 | Warn and continue for unclassified rows. | Users can manually add flagged products in Single Mode if needed. |
| 2026-05-14 | Ignore same-texture price differences under 5 cents and use the first encountered price. | Small Hextom/export rounding differences should not block the workflow. |
| 2026-05-14 | Require one upload with the necessary `Option value 1` rows instead of three separate texture uploads. | One-file parsing is the intended workflow. |
| 2026-05-14 | Group Multi Mode CSV output by product. | Product grouping should be easier to inspect and reason about. |
| 2026-05-14 | Show an upload summary alert with detected product count every time. | Users need to confirm the upload aligns with their source export. |
| 2026-05-14 | Treat price differences of 5 cents or more as conflicts. | Differences at or above the threshold should be reviewed. |
| 2026-05-14 | Warn and ignore weight when weight varies within the same handle/texture group. | Weight can be manually added later and should not overcomplicate the first Multi Mode version. |
| 2026-05-14 | Multi Mode exports the whole uploaded file. | The user wants one export for all detected texture groups. |
| 2026-05-14 | Warnings show affected handles first with pop-out/inspect details. | Keeps warning UI compact while preserving row-level detail when needed. |
| 2026-05-18 | Generated variants preview renders one product first, then reveals 4 more products per click. | Large Multi Mode exports should stay responsive while full copy/download output remains available. |
| 2026-05-18 | Add Color Expansion Mode is the next iteration. | Adding a new color needs FT singles, DT base/new-color pairs, and DP ordered pairs containing the new color without regenerating old combinations. |
| 2026-05-18 | Implemented Add Color Expansion Mode with separate existing, new, and DT base color selections. | The tool can now generate Signal Violet-style additions without exporting old existing-color combinations. |
| 2026-05-18 | Absolute Multi Mode uses FT price math only as a conflict-resolution guide. | The formula helps choose between conflicting uploaded prices, but it should not create warnings or calculate generated export prices by itself. |




