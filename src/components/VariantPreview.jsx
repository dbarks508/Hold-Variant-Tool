function VariantPreview({ variants = [] }) {
  return (
    <section>
      <h2>Generated Variants</h2>

      <p>{variants.length} variants generated</p>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Title</th>
            <th>Texture</th>
            <th>Color 1</th>
            <th>Color 2</th>
            <th>Variant SKU</th>
            <th>Price ($)</th>
          </tr>
        </thead>

        <tbody>
          {variants.map((variant) => (
            <tr key={variant.sku}>
              <td>{variant.title}</td>
              <td>{variant.texture}</td>
              <td>{variant.color1}</td>
              <td>{variant.color2}</td>
              <td>{variant.sku}</td>
              <td>{variant.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default VariantPreview;
