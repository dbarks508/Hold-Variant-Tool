import {
  newProductProductFields,
  newProductRequiredPerProductFields,
  newProductVariantTextFields,
} from "../data/newProductExportOptions";

function InventoryExportOptions({ options, setOptions, isMultiMode = false }) {
  const visibleProductFields = isMultiMode
    ? newProductProductFields.filter(
        (field) => !newProductRequiredPerProductFields.includes(field.key),
      )
    : newProductProductFields;
  const visibleVariantTextFields = isMultiMode
    ? newProductVariantTextFields.filter(
        (field) => !newProductRequiredPerProductFields.includes(field.key),
      )
    : newProductVariantTextFields;

  function updateOption(key, value) {
    setOptions((currentOptions) => ({
      ...currentOptions,
      [key]: value,
    }));
  }

  return (
    <section className="tool-section">
      <h2>New Product Export Options</h2>

      <p className="export-options-help">
        Product fields are written once on the first row for each handle.
        Variant fields are written on every generated row. Boolean checkboxes
        export TRUE when checked and FALSE when unchecked.
        {isMultiMode &&
          " These choices are defaults for every uploaded product; nonblank optional price-sheet columns override them for that handle. Product title, type, tags, total quantity, inventory quantity, and QuickBooks ID come from the required price-sheet columns."}
      </p>

      <div className="export-options-group">
        <h3>Variant Fields</h3>

        <div className="option-grid">
          <label className="option-row">
            <input
              type="checkbox"
              checked={options.requiresShipping}
              onChange={(event) =>
                updateOption("requiresShipping", event.target.checked)
              }
            />
            <span>Requires shipping</span>
          </label>

          <label className="option-row">
            <input
              type="checkbox"
              checked={options.inventoryPolicyEnabled}
              onChange={(event) =>
                updateOption("inventoryPolicyEnabled", event.target.checked)
              }
            />
            <span>Inventory policy: continue</span>
          </label>

          <label className="option-row">
            <input
              type="checkbox"
              checked={options.inventoryTrackingEnabled}
              onChange={(event) =>
                updateOption("inventoryTrackingEnabled", event.target.checked)
              }
            />
            <span>Inventory tracking: shopify</span>
          </label>

          <label className="option-row">
            <input
              type="checkbox"
              checked={options.trackQuantity}
              onChange={(event) =>
                updateOption("trackQuantity", event.target.checked)
              }
            />
            <span>Track quantity</span>
          </label>
        </div>

        <div className="export-input-grid">
          {visibleVariantTextFields.map((field) => (
            <label className="field" key={field.key}>
              <span className="field-label">{field.label}</span>
              <input
                className="text-input"
                type="text"
                value={options[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => updateOption(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="export-options-group">
        <h3>Product Fields</h3>

        <div className="export-input-grid">
          {visibleProductFields.map((field) => (
            <label className="field" key={field.key}>
              <span className="field-label">{field.label}</span>
              <input
                className="text-input"
                type="text"
                value={options[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => updateOption(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

export default InventoryExportOptions;
