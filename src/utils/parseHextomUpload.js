import Papa from "papaparse";
import * as XLSX from "xlsx";

const REQUIRED_HEADERS = [
  {
    label: "Product handle",
    aliases: ["Product handle", "Handle"],
  },
  {
    label: "Variant price",
    aliases: ["Variant price", "Price"],
  },
  {
    label: "Variant weight",
    aliases: ["Variant weight", "Weight"],
  },
  {
    label: "Option value 1",
    aliases: ["Option value 1", "Variant option 1 value"],
  },
];

const TEXTURE_ORDER = ["FT", "DT", "DP"];

function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase();
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function detectTexture(optionValue) {
  const match = normalizeValue(optionValue).match(/-\s*(DT|FT|DP)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function parsePrice(value) {
  const cleaned = normalizeValue(value).replace(/[$,]/g, "");
  const parsed = Number.parseFloat(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function buildHeaderMap(row = {}) {
  return Object.keys(row).reduce((map, header) => {
    map[normalizeHeader(header)] = header;
    return map;
  }, {});
}

function getHeaderKey(headerMap, headerConfig) {
  const matchedAlias = headerConfig.aliases.find(
    (alias) => headerMap[normalizeHeader(alias)],
  );

  return matchedAlias ? headerMap[normalizeHeader(matchedAlias)] : "";
}

function getRequiredValue(row, headerMap, headerConfig) {
  return row[getHeaderKey(headerMap, headerConfig)];
}

function parseCsv(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

function parseXlsx(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
  });
}

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function formatPrice(price) {
  return Number.isFinite(price) ? price.toFixed(2) : "";
}

function buildHandleWarning(type, label, rows) {
  const handles = [...new Set(rows.map((row) => row.handle).filter(Boolean))];

  return {
    type,
    label,
    handles,
    rows,
  };
}

function buildParsedUpload(rows) {
  if (rows.length === 0) {
    return {
      groups: [],
      warnings: [],
      summary: {
        parsedRowCount: 0,
        duplicateRowCount: 0,
        productCount: 0,
        productCountByTexture: {},
        conflictCount: 0,
        unclassifiedRowCount: 0,
      },
    };
  }

  const headerMap = buildHeaderMap(rows[0]);
  const missingHeaders = REQUIRED_HEADERS.filter(
    (headerConfig) => !getHeaderKey(headerMap, headerConfig),
  ).map((headerConfig) => headerConfig.label);

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }

  const groupsByKey = new Map();
  const exactRows = new Set();
  const products = new Set();
  const productsByTexture = new Map();
  const unclassifiedRows = [];
  let duplicateRowCount = 0;

  rows.forEach((row, rowIndex) => {
    const handle = normalizeValue(
      getRequiredValue(row, headerMap, REQUIRED_HEADERS[0]),
    );
    const price = normalizeValue(
      getRequiredValue(row, headerMap, REQUIRED_HEADERS[1]),
    );
    const weight = normalizeValue(
      getRequiredValue(row, headerMap, REQUIRED_HEADERS[2]),
    );
    const optionValue = normalizeValue(
      getRequiredValue(row, headerMap, REQUIRED_HEADERS[3]),
    );
    const texture = detectTexture(optionValue);
    const sourceRow = {
      rowNumber: rowIndex + 2,
      handle,
      price,
      weight,
      optionValue,
      texture,
    };

    if (!handle || !texture) {
      unclassifiedRows.push(sourceRow);
      return;
    }

    const exactKey = [handle, texture, price, weight].join("|");

    if (exactRows.has(exactKey)) {
      duplicateRowCount += 1;
      return;
    }

    exactRows.add(exactKey);
    products.add(handle);

    if (!productsByTexture.has(texture)) {
      productsByTexture.set(texture, new Set());
    }

    productsByTexture.get(texture).add(handle);

    const groupKey = [handle, texture].join("|");

    if (!groupsByKey.has(groupKey)) {
      groupsByKey.set(groupKey, {
        handle,
        texture,
        rows: [],
      });
    }

    groupsByKey.get(groupKey).rows.push(sourceRow);
  });

  const priceConflictRows = [];
  const weightConflictRows = [];
  const groups = [...groupsByKey.values()].map((group) => {
    const firstRow = group.rows[0];
    const firstPriceNumber = parsePrice(firstRow.price);
    const groupPriceConflictRows = [];
    const weights = new Set(group.rows.map((row) => row.weight));
    const hasWeightConflict = weights.size > 1;

    group.rows.slice(1).forEach((row) => {
      const rowPriceNumber = parsePrice(row.price);

      if (
        firstPriceNumber !== null &&
        rowPriceNumber !== null &&
        Math.abs(rowPriceNumber - firstPriceNumber) >= 0.05
      ) {
        groupPriceConflictRows.push(row);
      }
    });

    if (groupPriceConflictRows.length > 0) {
      priceConflictRows.push(
        {
          ...firstRow,
          priceWarningRole: "used",
          referencePrice: firstRow.price,
        },
        ...groupPriceConflictRows.map((row) => ({
          ...row,
          priceWarningRole: "conflict",
          referencePrice: firstRow.price,
        })),
      );
    }

    if (hasWeightConflict) {
      weightConflictRows.push(...group.rows);
    }

    return {
      handle: group.handle,
      texture: group.texture,
      price: firstPriceNumber === null ? firstRow.price : formatPrice(firstPriceNumber),
      weight: hasWeightConflict ? "" : firstRow.weight,
      hasWeightConflict,
      rows: group.rows,
    };
  });

  const warnings = [];

  if (priceConflictRows.length > 0) {
    warnings.push(
      buildHandleWarning("price-conflict", "Price conflicts", priceConflictRows),
    );
  }

  if (weightConflictRows.length > 0) {
    warnings.push(
      buildHandleWarning("weight-conflict", "Weight varies", weightConflictRows),
    );
  }

  if (unclassifiedRows.length > 0) {
    warnings.push(
      buildHandleWarning(
        "unclassified",
        "Unclassified rows",
        unclassifiedRows,
      ),
    );
  }

  groups.sort((a, b) => {
    const handleSort = a.handle.localeCompare(b.handle);

    if (handleSort !== 0) {
      return handleSort;
    }

    return TEXTURE_ORDER.indexOf(a.texture) - TEXTURE_ORDER.indexOf(b.texture);
  });

  return {
    groups,
    warnings,
    summary: {
      parsedRowCount: rows.length,
      duplicateRowCount,
      productCount: products.size,
      productCountByTexture: Object.fromEntries(
        [...productsByTexture.entries()].map(([texture, textureProducts]) => [
          texture,
          textureProducts.size,
        ]),
      ),
      conflictCount: warnings.filter((warning) => warning.type !== "unclassified")
        .length,
      unclassifiedRowCount: unclassifiedRows.length,
    },
  };
}

export async function parseHextomUpload(file) {
  const extension = getFileExtension(file.name);

  if (extension === "csv") {
    return buildParsedUpload(parseCsv(await file.text()));
  }

  if (extension === "xlsx" || extension === "xls") {
    return buildParsedUpload(parseXlsx(await file.arrayBuffer()));
  }

  throw new Error("Upload a .csv or .xlsx Hextom export.");
}

