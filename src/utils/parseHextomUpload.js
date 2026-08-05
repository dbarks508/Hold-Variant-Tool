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

const NEW_PRODUCT_PRICE_HEADERS = {
  handle: ["Handle", "Product handle"],
  weight: ["Weight", "Variant weight"],
  FT: ["FT price", "Price FT", "FT", "Full Texture price"],
  DT: ["DT price", "Price DT", "DT", "Dual Tex price"],
  DP: ["DP price", "Price DP", "DP", "Dual-Tex Premium price"],
};

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

function getAliasHeaderKey(headerMap, aliases = []) {
  const matchedAlias = aliases.find((alias) => headerMap[normalizeHeader(alias)]);

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

function getPriceKey(row) {
  const parsedPrice = parsePrice(row.price);

  return parsedPrice === null ? normalizeValue(row.price) : formatPrice(parsedPrice);
}

function getMostCommonPrice(rows) {
  const priceCounts = new Map();

  rows.forEach((row, index) => {
    const priceKey = getPriceKey(row);
    const priceCount = priceCounts.get(priceKey) || {
      price: priceKey,
      count: 0,
      firstIndex: index,
    };

    priceCounts.set(priceKey, {
      ...priceCount,
      count: priceCount.count + 1,
    });
  });

  return [...priceCounts.values()].sort((priceA, priceB) => {
    if (priceA.count !== priceB.count) {
      return priceB.count - priceA.count;
    }

    return priceA.firstIndex - priceB.firstIndex;
  })[0]?.price || "";
}

function hasPriceConflict(rows) {
  const parsedPrices = rows
    .map((row) => parsePrice(row.price))
    .filter((price) => price !== null);

  if (parsedPrices.length < 2) {
    return false;
  }

  return Math.max(...parsedPrices) - Math.min(...parsedPrices) >= 0.05;
}

function buildHandleWarning(type, label, rows, copyRows = rows) {
  const handles = [...new Set(rows.map((row) => row.handle).filter(Boolean))];
  const originalHeaders = [
    ...new Set(
      copyRows.flatMap((row) =>
        row.originalRow ? Object.keys(row.originalRow) : [],
      ),
    ),
  ];

  return {
    type,
    label,
    handles,
    rows,
    copyRows,
    originalHeaders,
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
        exportableProductCount: 0,
        exportableGroupCount: 0,
        excludedProductCount: 0,
        excludedGroupCount: 0,
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
  const sourceRows = [];
  const unclassifiedRows = [];
  const unclassifiedHandles = new Set();
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
      rowNumber: row.__sourceRowNumber || rowIndex + 2,
      handle,
      price,
      weight,
      optionValue,
      texture,
      originalRow: row.__originalRow || row,
    };

    sourceRows.push(sourceRow);

    if (handle) {
      products.add(handle);
    }

    if (!handle || !texture) {
      unclassifiedRows.push(sourceRow);

      if (handle) {
        unclassifiedHandles.add(handle);
      }

      return;
    }

    const exactKey = [handle, texture, price, weight].join("|");

    if (exactRows.has(exactKey)) {
      duplicateRowCount += 1;
    } else {
      exactRows.add(exactKey);
    }

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
  const parsedGroups = [...groupsByKey.values()].map((group) => {
    const chosenPrice = getMostCommonPrice(group.rows);
    const groupPriceConflictRows = [];
    const weights = new Set(group.rows.map((row) => row.weight));
    const hasWeightConflict = weights.size > 1;
    const hasGroupPriceConflict = hasPriceConflict(group.rows);
    const isExcluded = hasGroupPriceConflict || hasWeightConflict;

    group.rows.forEach((row) => {
      if (hasGroupPriceConflict && getPriceKey(row) !== chosenPrice) {
        groupPriceConflictRows.push(row);
      }
    });

    if (groupPriceConflictRows.length > 0) {
      priceConflictRows.push(
        {
          ...group.rows.find((row) => getPriceKey(row) === chosenPrice),
          priceWarningRole: "used",
          referencePrice: chosenPrice,
        },
        ...groupPriceConflictRows.map((row) => ({
          ...row,
          priceWarningRole: "conflict",
          referencePrice: chosenPrice,
        })),
      );
    }

    if (hasWeightConflict) {
      weightConflictRows.push(...group.rows);
    }

    return {
      handle: group.handle,
      texture: group.texture,
      price: chosenPrice,
      weight: hasWeightConflict ? "" : group.rows[0].weight,
      excluded: isExcluded,
      exclusionReasons: [
        hasGroupPriceConflict ? "price-conflict" : "",
        hasWeightConflict ? "weight-conflict" : "",
      ].filter(Boolean),
      hasWeightConflict,
      rows: group.rows,
    };
  });
  const excludedHandles = new Set(
    [
      ...parsedGroups
        .filter((group) => group.excluded)
        .map((group) => group.handle),
      ...unclassifiedHandles,
    ],
  );
  const groups = parsedGroups.map((group) => {
    if (!excludedHandles.has(group.handle)) {
      return group;
    }

    return {
      ...group,
      excluded: true,
      exclusionReasons:
        group.exclusionReasons.length > 0
          ? group.exclusionReasons
          : ["unclassified"],
    };
  });

  const warnings = [];
  const getSourceRowsForHandles = (handles) =>
    sourceRows.filter((row) => handles.has(row.handle));

  if (priceConflictRows.length > 0) {
    const handles = new Set(priceConflictRows.map((row) => row.handle));

    warnings.push(
      buildHandleWarning(
        "price-conflict",
        "Excluded from export: price conflicts",
        priceConflictRows,
        getSourceRowsForHandles(handles),
      ),
    );
  }

  if (weightConflictRows.length > 0) {
    const handles = new Set(weightConflictRows.map((row) => row.handle));

    warnings.push(
      buildHandleWarning(
        "weight-conflict",
        "Excluded from export: weight varies",
        weightConflictRows,
        getSourceRowsForHandles(handles),
      ),
    );
  }

  if (unclassifiedRows.length > 0) {
    const handles = new Set(unclassifiedRows.map((row) => row.handle));
    const rowsWithoutHandles = unclassifiedRows.filter((row) => !row.handle);
    const copyRows = [
      ...getSourceRowsForHandles(handles),
      ...rowsWithoutHandles,
    ];

    warnings.push(
      buildHandleWarning(
        "unclassified",
        "Excluded from export: unclassified rows",
        unclassifiedRows,
        copyRows,
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

  const exportableProductCount = new Set(
    groups.filter((group) => !group.excluded).map((group) => group.handle),
  ).size;
  const excludedProductCount = products.size - exportableProductCount;

  return {
    groups,
    warnings,
    summary: {
      parsedRowCount: rows.length,
      duplicateRowCount,
      productCount: products.size,
      exportableProductCount,
      exportableGroupCount: groups.filter((group) => !group.excluded).length,
      excludedProductCount,
      excludedGroupCount: groups.filter((group) => group.excluded).length,
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

function hasNewProductPriceHeaders(rows) {
  if (rows.length === 0) {
    return false;
  }

  const headerMap = buildHeaderMap(rows[0]);
  const handleHeader = getAliasHeaderKey(
    headerMap,
    NEW_PRODUCT_PRICE_HEADERS.handle,
  );
  const hasTexturePrice = TEXTURE_ORDER.some((texture) =>
    getAliasHeaderKey(headerMap, NEW_PRODUCT_PRICE_HEADERS[texture]),
  );

  return Boolean(handleHeader && hasTexturePrice);
}

function buildNewProductPriceUpload(rows) {
  const headerMap = buildHeaderMap(rows[0]);
  const handleHeader = getAliasHeaderKey(
    headerMap,
    NEW_PRODUCT_PRICE_HEADERS.handle,
  );
  const weightHeader = getAliasHeaderKey(
    headerMap,
    NEW_PRODUCT_PRICE_HEADERS.weight,
  );
  const priceHeaders = Object.fromEntries(
    TEXTURE_ORDER.map((texture) => [
      texture,
      getAliasHeaderKey(headerMap, NEW_PRODUCT_PRICE_HEADERS[texture]),
    ]),
  );
  const normalizedRows = rows.flatMap((row, rowIndex) => {
    const handle = normalizeValue(row[handleHeader]);
    const weight = weightHeader ? normalizeValue(row[weightHeader]) : "";

    return TEXTURE_ORDER.flatMap((texture) => {
      const priceHeader = priceHeaders[texture];
      const price = priceHeader ? normalizeValue(row[priceHeader]) : "";

      if (!price) {
        return [];
      }

      return [
        {
          "Product handle": handle,
          "Variant price": price,
          "Variant weight": weight,
          "Option value 1": `New Product - ${texture}`,
          __sourceRowNumber: rowIndex + 2,
          __originalRow: row,
        },
      ];
    });
  });

  if (normalizedRows.length === 0) {
    throw new Error(
      "The New Product price sheet does not contain any FT, DT, or DP prices.",
    );
  }

  const parsedUpload = buildParsedUpload(normalizedRows);

  return {
    ...parsedUpload,
    inputFormat: "new-product-prices",
    summary: {
      ...parsedUpload.summary,
      inputFormat: "new-product-prices",
      priceSheetRowCount: rows.length,
    },
  };
}

export async function parseHextomUpload(file) {
  const extension = getFileExtension(file.name);
  let rows;

  if (extension === "csv") {
    rows = parseCsv(await file.text());
  } else if (extension === "xlsx" || extension === "xls") {
    rows = parseXlsx(await file.arrayBuffer());
  } else {
    throw new Error(
      "Upload a .csv or .xlsx New Product price sheet or Hextom export.",
    );
  }

  if (hasNewProductPriceHeaders(rows)) {
    return buildNewProductPriceUpload(rows);
  }

  const parsedUpload = buildParsedUpload(rows);

  return {
    ...parsedUpload,
    inputFormat: "hextom",
    summary: {
      ...parsedUpload.summary,
      inputFormat: "hextom",
    },
  };
}

