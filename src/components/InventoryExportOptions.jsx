function InventoryExportOptions({
  inventoryPolicyEnabled,
  setInventoryPolicyEnabled,
  inventoryTrackingEnabled,
  setInventoryTrackingEnabled,
}) {
  return (
    <section className="tool-section">
      <h2>Inventory Export Options</h2>

      <div className="option-grid">
        <label className="option-row">
          <input
            type="checkbox"
            checked={inventoryPolicyEnabled}
            onChange={(e) => setInventoryPolicyEnabled(e.target.checked)}
          />
          <span>Inventory policy: continue</span>
        </label>

        <label className="option-row">
          <input
            type="checkbox"
            checked={inventoryTrackingEnabled}
            onChange={(e) => setInventoryTrackingEnabled(e.target.checked)}
          />
          <span>Inventory tracking: shopify</span>
        </label>
      </div>
    </section>
  );
}

export default InventoryExportOptions;
