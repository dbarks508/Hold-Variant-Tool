function ParentSkuInput({ parentSku, setParentSku }) {
  return (
    <section>
      <label>
        Parent SKU:
        <input
          type="text"
          value={parentSku}
          onChange={(e) => setParentSku(e.target.value)}
          placeholder="Example: kx123"
        />
      </label>
    </section>
  );
}

export default ParentSkuInput;
