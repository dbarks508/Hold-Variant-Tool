import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

let server;
let colors, textures, manufacturers, generateVariants, generateMultiVariants;
let parseHextomUpload, getDetectedTextures, getVariantCsvRows, buildVariantsCsv;
let isTextureSupported, TextureSelector, HextomUpload, DtBaseColorSelector;

before(async () => {
  // Vite loads the project's JSX modules just as it does for the app.
  server = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: "custom",
  });
  const modules = await Promise.all([
    "/src/data/colors.jsx",
    "/src/data/textures.jsx",
    "/src/data/manufacturers.jsx",
    "/src/utils/generateVariants.js",
    "/src/utils/generateMultiVariants.js",
    "/src/utils/parseHextomUpload.js",
    "/src/utils/exportCsv.jsx",
    "/src/utils/manufacturerRules.js",
    "/src/components/TextureSelector.jsx",
    "/src/components/HextomUpload.jsx",
    "/src/components/DtBaseColorSelector.jsx",
  ].map((path) => server.ssrLoadModule(path)));
  [
    { colors }, { textures }, { manufacturers }, { generateVariants },
    { generateMultiVariants, getDetectedTextures }, { parseHextomUpload },
    { getVariantCsvRows, buildVariantsCsv }, { isTextureSupported },
    { default: TextureSelector }, { default: HextomUpload },
    { default: DtBaseColorSelector },
  ] = modules;
});

after(async () => {
  await server?.close();
});

const manufacturer = (code) => manufacturers.find((item) => item.code === code);
const color = (name) => colors.find((item) => item.name === name);
const barockaColors = () => colors.filter((item) => item.codes.barocka);
const barockaTextures = () => textures.filter((item) => item.code !== "DP");
const prices = { FT: "100.00", DT: "110.00", NT: "90.00" };
const generate = (overrides = {}) => generateVariants({
  selectedMfgr: manufacturer("barocka"),
  parentSku: "KWB001",
  selectedColors: barockaColors(),
  selectedTextures: textures,
  pricesByTexture: prices,
  ...overrides,
});
const csvFile = (rows) => ({
  name: "products.csv",
  text: async () => Papa.unparse(rows),
});
const productRow = (overrides = {}) => ({
  handle: "KWB001",
  "FT price": "100",
  "DT price": "110",
  "NT price": "90",
  weight: "2.5",
  "product title": "Wood Volume",
  "product type": "Volumes",
  "product tags": "wood,barocka",
  "qty.total": "1",
  "inventory quantity": "0",
  "quickbooks.pID": "Volumes:Barocka:KWB001",
  ...overrides,
});

test("Barocka offers exactly the documented 14 color codes and three textures", () => {
  assert.equal(manufacturer("barocka").label, "Barocka");
  assert.deepEqual(Object.fromEntries(barockaColors().map((item) => [item.name, item.codes.barocka])), {
    white: "BA112-01", yellow: "BA115-12", "lime green": "BA216-09",
    green: "BA116-16", red: "BA111-12", pink: "BA111-26",
    orange: "BA114-01", blue: "BA113-01", "euro mint": "BA213-25",
    mint: "BA116-27", "light gray": "BA218-12", "dark granite": "BA218-09",
    black: "BA118-01", "light purple": "BA217-18",
  });
  assert.deepEqual(textures.filter((item) => isTextureSupported(manufacturer("barocka"), item.code))
    .map((item) => item.code), ["FT", "DT", "NT"]);
  assert.equal(textures.find((item) => item.code === "NT").label, "No Texture");
});

test("Single New Product generates 42 unique variants with matching DT pairs only", () => {
  const variants = generate();
  assert.equal(variants.length, 42);
  assert.equal(new Set(variants.map((item) => item.sku)).size, 42);
  for (const variant of variants) {
    assert.equal(variant.price, prices[variant.texture]);
    assert.equal(variant.title, `${variant.color1} - ${variant.texture}`);
    assert.equal(variant.title.includes("/"), false);
    assert.equal(variant.sku.includes("/"), variant.texture === "DT");
    if (variant.texture === "DT") assert.equal(variant.color1, variant.color2);
  }
  assert.deepEqual(variants.filter((item) => item.color1 === "Black").map((item) => item.sku), [
    "KWB001.BA118-01(FT)",
    "KWB001.BA118-01/BA118-01(DT)",
    "KWB001.BA118-01(NT)",
  ]);
});

test("Single Add Color generates only new colors without requiring companions", () => {
  const variants = generate({
    generationMode: "add-color",
    selectedNewColors: [color("black"), color("mint")],
    selectedExistingColors: [color("red"), color("white")],
  });
  assert.equal(variants.length, 6);
  assert.deepEqual([...new Set(variants.map((item) => item.color1))], ["Black", "Mint"]);
  assert.ok(variants.filter((item) => item.texture === "DT").every((item) => item.color1 === item.color2));
  assert.equal(generate({ generationMode: "add-color", selectedNewColors: [color("black")] }).length, 3);
  assert.equal(generate({ generationMode: "add-color" }).length, 0);
});

test("One Single Mode product exports all 42 variants with correct prices, weight, and product fields", () => {
  const variants = generate();
  const options = {
    isNewProduct: true,
    optionName1: "Color",
    requiresShipping: true,
    trackQuantity: true,
    inventoryPolicyEnabled: true,
    inventoryQuantity: "0",
    productTitle: "Wood Volume",
    productType: "Volumes",
    productTags: "wood,barocka",
    totalQuantity: "1",
    quickbooksProductId: "Volumes:Barocka:KWB001",
    status: "draft",
  };
  const csv = buildVariantsCsv(variants, "KWB001", "2.5", options);
  const { data: rows, errors } = Papa.parse(csv, { header: true });
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 42);
  assert.deepEqual([...new Set(rows.map((row) => row.handle))], ["KWB001"]);
  for (const texture of ["FT", "DT", "NT"]) {
    const textureRows = rows.filter((row) => row["option value 1"].endsWith(` - ${texture}`));
    assert.equal(textureRows.length, 14);
    assert.ok(textureRows.every((row) => row["variant price"] === prices[texture]));
  }
  for (const row of rows) {
    assert.equal(row.weight, "2.5");
    assert.equal(row["requires shipping"], "TRUE");
    assert.equal(row["track quantity"], "TRUE");
    assert.equal(row["inventory policy"], "continue");
    assert.equal(row["inventory quantity"], "0");
  }
  assert.equal(rows[0]["option name 1"], "Color");
  assert.equal(rows[0]["product title"], "Wood Volume");
  assert.equal(rows[0]["product type"], "Volumes");
  assert.equal(rows[0]["product tags"], "wood,barocka");
  assert.equal(rows[0]["qty.total"], "1");
  assert.equal(rows[0]["quickbooks.pID"], "Volumes:Barocka:KWB001");
  assert.equal(rows[0].status, "draft");
  assert.ok(rows.slice(1).every((row) => row["product title"] === "" && row["option name 1"] === ""));
});

test("DT base-color prompts are absent for Barocka and Supr and present for Absolute and Walltopia", () => {
  for (const code of ["barocka", "supr", "absolute", "walltopia"]) {
    const markup = renderToStaticMarkup(createElement(DtBaseColorSelector, {
      selectedMfgr: manufacturer(code),
      selectedColors: [color("black")],
      selectedTextures: textures.filter((item) => item.code === "DT"),
      selectedDtBaseColors: [],
      setSelectedDtBaseColors: () => {},
    }));
    if (["barocka", "supr"].includes(code)) assert.equal(markup, "");
    else assert.ok(markup.includes(`${manufacturer(code).label} DT Base Colors`));
  }
});

test("Multi New Product imports FT/DT/NT pricing and exports product metadata and weights", async () => {
  const upload = await parseHextomUpload(csvFile([
    productRow(),
    productRow({ handle: "KWB002", weight: "3", "NT price": "95", "product title": "Second Volume" }),
  ]), { requireNewProductPriceSheet: true });
  assert.deepEqual(upload.warnings, []);
  assert.equal(upload.summary.productCount, 2);
  assert.deepEqual(upload.summary.productCountByTexture, { FT: 2, DT: 2, NT: 2 });
  assert.deepEqual(getDetectedTextures(upload.groups, textures).map((item) => item.code), ["FT", "DT", "NT"]);
  const variants = generateMultiVariants({
    groups: upload.groups, textures, selectedMfgr: manufacturer("barocka"), selectedColors: barockaColors(),
  });
  assert.equal(variants.length, 84);
  const rows = getVariantCsvRows(variants, "", "", {
    isNewProduct: true, optionName1: "Color", requiresShipping: true, trackQuantity: true,
  });
  for (const handle of ["KWB001", "KWB002"]) {
    const productRows = rows.filter((row) => row.handle === handle);
    assert.equal(productRows.length, 42);
    assert.equal(productRows[0]["product title"], handle === "KWB001" ? "Wood Volume" : "Second Volume");
    assert.equal(productRows[0]["product type"], "Volumes");
    assert.equal(productRows[0]["option name 1"], "Color");
    assert.ok(productRows.slice(1).every((row) => row["product title"] === ""));
    assert.ok(productRows.every((row) => row.weight === (handle === "KWB001" ? "2.5" : "3")));
    assert.ok(productRows.every((row) => row["requires shipping"] === "TRUE" && row["inventory quantity"] === "0"));
  }
  assert.equal(rows.find((row) => row.handle === "KWB002" && row["option value 1"] === "Black - NT")["variant price"], "95.00");
  const csv = buildVariantsCsv(variants, "", "", { isNewProduct: true });
  assert.equal(Papa.parse(csv, { header: true }).data.length, 84);
});

for (const header of ["NT price", "Price NT", "NT", "No Texture price"]) {
  test(`NT-only price sheets accept the ${header} header`, async () => {
    const row = productRow();
    delete row["FT price"];
    delete row["DT price"];
    delete row["NT price"];
    row[header] = "89.50";
    const upload = await parseHextomUpload(csvFile([row]), { requireNewProductPriceSheet: true });
    assert.equal(upload.groups.length, 1);
    assert.equal(upload.groups[0].texture, "NT");
    assert.equal(upload.groups[0].price, "89.50");
  });
}

test("XLSX price sheets preserve NT pricing", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([productRow()]), "Volumes");
  const file = { name: "volumes.xlsx", arrayBuffer: async () => XLSX.write(workbook, { type: "array", bookType: "xlsx" }) };
  const upload = await parseHextomUpload(file, { requireNewProductPriceSheet: true });
  assert.deepEqual(upload.groups.map((item) => item.texture), ["FT", "DT", "NT"]);
});

test("Multi Add Color classifies NT separately and exports only new solid colors", async () => {
  const sourceRows = ["FT", "DT", "NT"].flatMap((texture) => ["Black", "White"].map((name) => ({
    "Product handle": "KWB001", "Variant price": prices[texture], "Variant weight": "2.5", "Option value 1": `${name} - ${texture}`,
  })));
  const upload = await parseHextomUpload(csvFile(sourceRows));
  assert.equal(upload.groups.length, 3);
  assert.equal(upload.groups.find((item) => item.texture === "NT").price, "90.00");
  const variants = generateMultiVariants({
    groups: upload.groups, textures, selectedMfgr: manufacturer("barocka"),
    generationMode: "add-color", selectedNewColors: [color("mint")], selectedExistingColors: [color("black"), color("white")],
  });
  assert.deepEqual(variants.map((item) => item.title), ["Mint - FT", "Mint - DT", "Mint - NT"]);
  const rows = getVariantCsvRows(variants, "", "", { requiresShipping: true, trackQuantity: true, inventoryQuantity: "0" });
  assert.equal(rows.length, 3);
  assert.equal(rows[1]["variant sku"], "KWB001.BA116-27/BA116-27(DT)");
  assert.equal(rows[2]["variant sku"], "KWB001.BA116-27(NT)");
  assert.ok(rows.every((row) => row.weight === "2.5" && row["inventory quantity"] === "0"));
  assert.equal("product title" in rows[0], false);
});

test("Implicit FT input still produces a texture suffix for Barocka", async () => {
  const row = productRow({ price: "100" });
  delete row["FT price"];
  delete row["DT price"];
  delete row["NT price"];
  const upload = await parseHextomUpload(csvFile([row]), { requireNewProductPriceSheet: true });
  const options = { groups: upload.groups, textures, selectedColors: [color("black")] };
  assert.equal(generateMultiVariants({ ...options, selectedMfgr: manufacturer("barocka") })[0].title, "Black - FT");
  assert.equal(generateMultiVariants({ ...options, selectedMfgr: manufacturer("compx") })[0].title, "Black");
});

test("NT price conflicts exclude the whole handle just as other textures do", async () => {
  const upload = await parseHextomUpload(csvFile([
    { Handle: "KWB001", Price: "90", Weight: "2.5", "Option value 1": "Black - NT" },
    { Handle: "KWB001", Price: "95", Weight: "2.5", "Option value 1": "White - NT" },
    { Handle: "KWB001", Price: "100", Weight: "2.5", "Option value 1": "White - FT" },
  ]));
  assert.equal(upload.summary.excludedProductCount, 1);
  assert.ok(upload.groups.every((item) => item.excluded));
  assert.deepEqual(generateMultiVariants({ groups: upload.groups, textures, selectedMfgr: manufacturer("barocka"), selectedColors: barockaColors() }), []);
});

test("Existing manufacturer SKU and pairing conventions are preserved, and NT is rejected", () => {
  const expectedFt = {
    compx: ["KWB001.CX018-01", "Black"], aragon: ["KWB001.AR018-01", "Black"],
    absolute: ["KWB001.AB018-01(FT)", "Black - FT"], supr: ["KWB001.SP018-01(FT)", "Black - FT"],
    walltopia: ["KWB001.WT118-01(FT)", "Black - FT"], core: ["KWB001.CO118-01", "Black - FT"],
  };
  for (const [code, [sku, title]] of Object.entries(expectedFt)) {
    const variants = generate({ selectedMfgr: manufacturer(code), selectedColors: [color("black"), color("white")], selectedDtBaseColors: [color("black")] });
    assert.deepEqual([variants[0].sku, variants[0].title], [sku, title]);
    assert.ok(variants.every((item) => item.texture !== "NT"));
    const paired = variants.filter((item) => item.texture === "DT");
    if (["compx", "aragon"].includes(code)) assert.equal(variants.length, 2);
    else {
      assert.equal(paired.length, ["absolute", "walltopia"].includes(code) ? 2 : 4);
      assert.ok(paired.some((item) => item.title === "Black/White - DT"));
      assert.equal(variants.filter((item) => item.texture === "DP").length, 4);
    }
  }
});

test("Barocka controls display No Texture and NT price-sheet guidance", () => {
  const markup = renderToStaticMarkup(createElement(TextureSelector, {
    textures: barockaTextures(), selectedTextures: [], setSelectedTextures: () => {}, selectedMfgr: manufacturer("barocka"),
  }));
  assert.ok(markup.includes("No Texture (NT)"));
  assert.equal(markup.includes("disabled"), false);
  assert.equal(markup.includes("Dual-Tex Premium"), false);
  const uploadMarkup = renderToStaticMarkup(createElement(HextomUpload, {
    selectedMfgr: manufacturer("barocka"), isNewProductMode: true,
    summary: { productCount: 1, productCountByTexture: { NT: 1 } },
  }));
  assert.ok(uploadMarkup.includes("NT price"));
  assert.equal(uploadMarkup.includes("DP price"), false);
  assert.ok(uploadMarkup.includes("<dt>NT</dt><dd>1</dd>"));
});
