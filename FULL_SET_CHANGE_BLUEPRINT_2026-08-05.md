# New Product Export Change Blueprint

**Created:** August 5, 2026  
**Status:** Implemented — pending user review

## Draft Ideas

Add new ideas below in any format. Rough notes are welcome; they can be organized into requirements and implementation steps later.

### New Product Export Options

Add more checkboxes and inputs to the current Inventory Export Options area. These controls are intended for creating a new product, so they should only appear when the current `Full Set` generation mode is active.

Terminology change:

- Rename the displayed `Full Set` option to `New Product`, because creating a new product is its primary use.
- Keep `Add Color` as the other generation option.
- The internal mode value can remain `full` initially to avoid an unnecessary data/state migration; this is an implementation detail and does not need to appear in the UI.

General export rules:

- Every added choice must flow through the same export-row builder so it appears consistently in Copy Table, Preview CSV, and Download CSV.
- A true boolean choice should use a checkbox.
- A value represented by text such as `Yes` or `No` should use an input rather than being treated as a boolean checkbox.
- Other text or numeric values should use an input appropriate to their data.
- Any source column whose name contains a period (`.`) is a metafield column. Preserve its exact header in the export.
- Product-level columns only need a value once per product. Write them on the first generated row for each product/handle and leave them blank on that product's remaining variant rows.
- Examples of product-level data include product title and QuickBooks data.
- Variant-level columns should receive a value on every applicable generated variant row.
- Preserve a deliberate, documented column order in copied, previewed, and downloaded output.

### Implemented Column Inventory

Reference inspected: `New Grips _ August - KVA025-variants.csv` (204 variant rows). The trailing space found on the source `inventory quantity ` header is normalized to `inventory quantity` in new exports.

| Export column | Scope | Control/source | Export value/rule |
| ------------- | ----- | -------------- | ----------------- |
| `handle` | Variant | Generated/uploaded handle | Every row |
| `option name 1` | Product | Optional upload column or text input; default `Color` | First row per handle |
| `option value 1` | Variant | Generated variant title | Every row |
| `variant sku` | Variant | Generated SKU | Every row |
| `variant price` | Variant | Single Mode price or uploaded Multi Mode texture price | Every row |
| `weight` | Variant | Single Mode input; required Multi New Product upload column | Every row |
| `requires shipping` | Variant | Optional upload column or boolean checkbox; default checked | `TRUE` or `FALSE` on every row |
| `inventory policy` | Variant | Optional upload column or existing checkbox | Uploaded value, or `continue` when enabled |
| `inventory tracking` | Variant | Optional upload column or existing checkbox | Uploaded value, or `shopify` when enabled |
| `track quantity` | Variant | Optional upload column or boolean checkbox; default checked | `TRUE` or `FALSE` on every row |
| `vendor` | Product | Optional upload column or text input | First row per handle |
| `qty.total` | Product metafield | Single Mode input; required Multi New Product upload column | First row per handle |
| `status` | Product | Optional upload column or text input; default `draft` | First row per handle |
| `quickbooks.pID` | Product metafield | Single Mode input; required Multi New Product upload column | First row per handle |
| `product title` | Product | Single Mode input; required Multi New Product upload column | First row per handle |
| `product type` | Product | Single Mode input; required Multi New Product upload column | First row per handle |
| `product tags` | Product | Single Mode input; required Multi New Product upload column | First row per handle |
| `inventory quantity` | Variant | Single Mode input; required Multi New Product upload column | Every row |

### New Product Options UI

- Show the extended export-options panel only in `New Product` generation mode.
- Hide it in `Add Color` mode so an add-color export does not accidentally overwrite product-level settings.
- Keep the existing inventory policy and inventory tracking choices in this panel.
- Group product-level fields separately from variant-level fields so users know whether a value is written once or repeated.
- Explain in the UI that product-level values are placed on the first export row for each handle.
- Provide a `Copy Base Headers` button beside the New Product price-sheet upload. It copies tab-separated `handle`, `FT price`, `DT price`, `DP price`, `weight`, `product title`, `product type`, `product tags`, `qty.total`, `inventory quantity`, and `quickbooks.pID` headers for direct pasting into a spreadsheet.

### Multi Mode Behavior

`New Product` and `Multi Mode` can work together, but values need to be divided into shared and product-specific data.

- The uploaded Hextom handle, detected texture, price, and weight remain authoritative for each parsed product/texture group.
- Shared variant-level choices from the UI are defaults for every generated variant.
- Shared product-level choices from the UI are defaults written once for each uploaded handle.
- A nonblank optional price-sheet column overrides the corresponding UI choice for that handle.
- A blank cell or missing optional column falls back to the shared UI choice.
- Unique titles, QuickBooks IDs, tags, and other per-product values should be supplied in the price sheet.
- If repeated price-sheet rows for the same handle contain conflicting product values, keep the first value and show a review warning.
- Copy Table, Preview CSV, and Download CSV must use the same product-first-row logic in Multi Mode.
- Absolute Multi Mode accepts FT, DT, and DP prices in the same Hextom file. Each handle/texture group retains its own uploaded price.

### New Product Price Sheet

New Product Multi Mode accepts a wide CSV or XLSX price sheet with one row per new product. Texture and price are detected from the column headers instead of `Option value 1`.

Required headers:

- `handle` or `Product handle`
- `weight` or `Variant weight`
- `product title`
- `product type`
- `product tags`
- `qty.total`
- `inventory quantity`
- `quickbooks.pID`

Supported price headers, matched case-insensitively:

- FT: `FT price`, `Price FT`, `FT`, or `Full Texture price`
- DT: `DT price`, `Price DT`, `DT`, or `Dual Tex price`
- DP: `DP price`, `Price DP`, `DP`, or `Dual-Tex Premium price`

Rules:

- At least one recognized texture-price column is required.
- Blank texture-price cells are skipped for that product.
- Each nonblank price cell becomes one handle/texture group.
- Uploaded prices are normalized to two decimal places for export.
- Weight, product title, product type, product tags, total quantity, inventory quantity, and QuickBooks ID are required and must contain a nonblank value on every product row.
- Missing required headers or row values stop parsing and identify the missing fields and affected row numbers.
- The remaining New Product selections work normally as shared defaults across the uploaded products.
- Product-level UI values are written once for each handle; variant-level UI values are written on every generated row.
- Optional per-product columns are matched case-insensitively: `option name 1`, `requires shipping`, `inventory policy`, `inventory tracking`, `track quantity`, `vendor`, and `status`.
- Nonblank optional values override the UI defaults for that handle; blank or missing values use the UI defaults.
- Uploaded boolean values accept `TRUE`/`FALSE`, `Yes`/`No`, or `1`/`0` and export as uppercase `TRUE`/`FALSE`.
- Add Color Multi Mode continues to describe and accept the standard Hextom export workflow.

Implemented override behavior:

1. Use the New Product UI choices as batch defaults.
2. Read optional values from each handle's price-sheet row.
3. Prefer a nonblank uploaded value over its UI default.
4. Preserve product fields on the first row per handle and variant fields on every row.
5. Use the resolved values in Copy Table, Preview CSV, and Download CSV.

### Open Items For Review

- Review the initial defaults: `Color`, requires shipping checked, track quantity checked, `draft`, and inventory quantity `0`.
- Confirm that normalizing the source header `inventory quantity ` to `inventory quantity` is desired.

## Product Details To Capture

- Product or manufacturer name:
- Reason for adding the product:
- Differences from the current Full Set workflow:
- Available colors and manufacturer color/SKU codes:
- Supported textures (`FT`, `DT`, and/or `DP`):
- Variant title rules:
- Variant SKU rules:
- Color-pairing or base-color rules:
- Price behavior:
- Weight behavior:
- Single Mode behavior:
- Multi Mode/Hextom behavior:
- CSV/export requirements:
- Expected variant counts and examples:
- Validation, warnings, and special cases:

## Confirmed Decisions

- The generation label is `New Product`; the internal value remains `full` for compatibility.
- New Product export controls are hidden and excluded from output in Add Color mode.
- Boolean fields export uppercase `TRUE` or `FALSE`.
- Inventory policy and inventory tracking retain their existing include-when-enabled behavior.
- Product fields are written on the first row of each handle only.
- Variant fields are written on every generated row.
- Copy Table, Preview CSV, and Download CSV share the same header and row builder.
- Multi Mode UI values are shared defaults; nonblank uploaded values override them per handle.

## Implementation Plan

1. [x] Inspect and document the reference CSV columns and row scopes.
2. [x] Define a central export-field schema containing headers, defaults, and UI metadata.
3. [x] Rename the displayed `Full Set` generation choice to `New Product`.
4. [x] Add the New Product-only product and variant export controls.
5. [x] Output product fields on the first row per handle and variant fields on every row.
6. [x] Use the shared output for Copy Table, Preview CSV, and Download CSV.
7. [x] Label Multi Mode UI values as shared defaults.
8. [x] Add optional per-handle mappings for every New Product input/output field.
9. [x] Make nonblank uploaded values override shared defaults in every output action.

## Verification Plan

- [x] New Product-only controls appear in `New Product` mode and are hidden in `Add Color` mode.
- [x] Configured columns share one ordered header/row builder across all three output actions.
- [x] Product-level fields contain a value only on the first row for each handle.
- [x] Variant-level fields contain the expected value on every applicable variant row.
- [x] Metafield headers retain their exact periods and spelling.
- [x] Boolean checkboxes serialize as uppercase `TRUE` or `FALSE`.
- [x] Multi Mode shared product values appear once for each exportable handle.
- [x] Add Color output excludes the New Product-only fields.
- [x] Absolute Multi Mode preserves separate uploaded FT, DT, and DP prices.
- [x] A 16-row New Product price sheet produces 16 products and 48 FT/DT/DP groups.
- [x] Three-decimal uploaded prices normalize to two decimal places.
- [x] New Product Multi Mode requires weight, product title, product type, product tags, total quantity, inventory quantity, and QuickBooks ID headers and values for every handle.
- [x] Missing required headers and row values produce targeted upload errors.
- [x] Uploaded product title, QuickBooks ID, tags, metafields, and other product fields override UI defaults per handle.
- [x] Uploaded shipping, tracking, inventory, and other variant fields override UI defaults on every variant for that handle.
- [x] Blank optional upload cells fall back to the shared UI defaults.
- [x] Uploaded boolean values normalize from true/false, yes/no, and 1/0.
- [x] Copy Base Headers copies all eleven required price-sheet headers in spreadsheet-friendly tab-separated form.
- [x] Lint and production build pass.

## Decision Log

| Date       | Decision                                  | Reason                           |
| ---------- | ----------------------------------------- | -------------------------------- |
| 2026-08-05 | Created a separate Full Set change file. | Keep this product addition focused and separate from the earlier project blueprint. |
| 2026-08-05 | New export options will only be displayed for the Full Set/New Product workflow. | The fields are intended for initial product creation, not Add Color exports. |
| 2026-08-05 | Columns containing a period are treated as metafield columns. | Their exact source headers must be preserved in export output. |
| 2026-08-05 | Product-level values are written once per product. | Fields such as title and QuickBooks data do not need to be repeated for every variant. |
| 2026-08-05 | Renamed the displayed Full Set mode to New Product. | The mode is primarily used when creating a product. |
| 2026-08-05 | Boolean export fields use checkboxes and serialize as `TRUE`/`FALSE`. | Matches the inspected reference CSV format. |
| 2026-08-05 | Absolute Multi Mode preserves independent FT, DT, and DP upload prices. | Each handle/texture group must export its uploaded price without formula substitution. |
| 2026-08-05 | New Product Multi Mode accepts a wide handle/FT price/DT price/DP price sheet. | New products do not have existing Hextom variant rows from which to detect texture and price. |
| 2026-08-05 | Texture is detected from price headers for New Product price sheets. | One row per handle is easier to prepare than a long variant-style upload. |
| 2026-08-05 | Every New Product value can be supplied as an optional price-sheet column. | Titles, QuickBooks IDs, tags, and other values can differ by handle in a multi-product batch. |
| 2026-08-05 | Nonblank upload values override UI choices; blank or missing values use UI defaults. | This supports per-product data without requiring manual edits after export. |
| 2026-08-05 | Copy Base Headers provides handle, texture prices, weight, title, type, tags, total quantity, inventory quantity, and QuickBooks ID. | These per-product values cannot be safely supplied as one shared UI value in Multi Mode. |
| 2026-08-05 | Weight, product title, product type, product tags, total quantity, inventory quantity, and QuickBooks ID are required for every New Product price-sheet row. | These values belong to individual products and must remain associated with the correct handle. |
