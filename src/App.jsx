import { useState } from "react";

import { colors } from "./data/colors";
import { textures } from "./data/textures";
import { newProductExportDefaults } from "./data/newProductExportOptions";
import { generateVariants } from "./utils/generateVariants";
import {
  generateMultiVariants,
  getDetectedTextures,
} from "./utils/generateMultiVariants";
import { parseHextomUpload } from "./utils/parseHextomUpload";
import { isFullTextureOnlyManufacturer } from "./utils/manufacturerRules";
import { manufacturers } from "./data/manufacturers";
import "./App.css";

import MfgrSelector from "./components/MfgrSelector";
import ModeToggle from "./components/ModeToggle";
import GenerationModeToggle from "./components/GenerationModeToggle";
import ParentSkuInput from "./components/ParentSkuInput";
import ColorSelector from "./components/ColorSelector";
import TextureSelector from "./components/TextureSelector";
import VariantPreview from "./components/VariantPreview";
import CsvDownloadButton from "./components/CsvDownloadButton";
import CsvPreviewButton from "./components/CsvPreviewButton";
import TexturePriceInputs from "./components/TexturePriceInputs";
import DtBaseColorSelector from "./components/DtBaseColorSelector";
import WeightInput from "./components/WeightInput";
import InventoryExportOptions from "./components/InventoryExportOptions";
import HextomUpload from "./components/HextomUpload";
import UploadWarnings from "./components/UploadWarnings";

const ABSOLUTE_PRICE_MULTIPLIERS = {
  DT: 1.1,
  DP: 1.3,
};

function parsePrice(price) {
  const priceNumber = Number.parseFloat(String(price).replace(/[$,]/g, ""));

  return Number.isFinite(priceNumber) ? priceNumber : null;
}

function formatPrice(price) {
  return Number.isFinite(price) ? price.toFixed(2) : "";
}

function getAbsoluteExpectedPrices(groups = [], selectedMfgr) {
  if (selectedMfgr?.code !== "absolute") {
    return new Map();
  }

  const ftPricesByHandle = groups.reduce((pricesByHandle, group) => {
    const price = parsePrice(group.price);

    if (
      !group.excluded &&
      group.texture === "FT" &&
      price !== null &&
      !pricesByHandle.has(group.handle)
    ) {
      pricesByHandle.set(group.handle, price);
    }

    return pricesByHandle;
  }, new Map());

  return groups.reduce((expectedPrices, group) => {
    if (group.excluded) {
      return expectedPrices;
    }

    const multiplier = ABSOLUTE_PRICE_MULTIPLIERS[group.texture];
    const ftPrice = ftPricesByHandle.get(group.handle);

    if (!multiplier || ftPrice === undefined) {
      return expectedPrices;
    }

    expectedPrices.set(
      `${group.handle}|${group.texture}`,
      formatPrice(ftPrice * multiplier),
    );

    return expectedPrices;
  }, new Map());
}

function getAbsolutePriceSuggestions(groups = [], selectedMfgr) {
  const expectedPrices = getAbsoluteExpectedPrices(groups, selectedMfgr);

  if (expectedPrices.size === 0) {
    return [];
  }

  const rows = groups
    .filter((group) => !group.excluded)
    .flatMap((group) => {
      const expectedPrice = expectedPrices.get(`${group.handle}|${group.texture}`);
      const actualPrice = parsePrice(group.price);
      const expectedPriceNumber = parsePrice(expectedPrice);

      if (
        !expectedPrice ||
        actualPrice === null ||
        expectedPriceNumber === null ||
        Math.abs(actualPrice - expectedPriceNumber) < 0.05
      ) {
        return [];
      }

      return {
        ...group.rows[0],
        price: group.price,
        expectedPrice,
        issueDetail: "Pricing may not match Absolute FT business logic.",
      };
    });

  if (rows.length === 0) {
    return [];
  }

  return [
    {
      type: "price-suggestion",
      label: "Needs review: price suggestions",
      handles: [...new Set(rows.map((row) => row.handle).filter(Boolean))],
      rows,
      copyRows: groups
        .filter((group) =>
          rows.some((row) => row.handle === group.handle),
        )
        .flatMap((group) => group.rows),
      originalHeaders: [
        ...new Set(
          rows.flatMap((row) =>
            row.originalRow ? Object.keys(row.originalRow) : [],
          ),
        ),
      ],
    },
  ];
}

function App() {
  const [mode, setMode] = useState("single");
  const [parentSku, setParentSku] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [generationMode, setGenerationMode] = useState("full");
  const [selectedExistingColors, setSelectedExistingColors] = useState([]);
  const [selectedNewColors, setSelectedNewColors] = useState([]);
  const [selectedTextures, setSelectedTextures] = useState([]);
  const [selectedMfgr, setSelectedMfgr] = useState(null);
  const [pricesByTexture, setPricesByTexture] = useState({});
  const [weight, setWeight] = useState("");
  const [newProductExportOptions, setNewProductExportOptions] = useState(
    newProductExportDefaults,
  );
  const [selectedDtBaseColors, setSelectedDtBaseColors] = useState([]);
  const [multiUpload, setMultiUpload] = useState({
    fileName: "",
    groups: [],
    warnings: [],
    summary: null,
    error: "",
  });
  const [isParsingUpload, setIsParsingUpload] = useState(false);

  function updateSelectedMfgr(mfgr) {
    setSelectedMfgr(mfgr);

    if (isFullTextureOnlyManufacturer(mfgr)) {
      setSelectedTextures((currentTextures) =>
        currentTextures.filter((texture) => texture.code === "FT"),
      );
      setSelectedDtBaseColors([]);
    }
  }

  async function updateHextomUpload(file) {
    if (!file) {
      return;
    }

    setIsParsingUpload(true);
    setMultiUpload((currentUpload) => ({
      ...currentUpload,
      fileName: file.name,
      error: "",
    }));

    try {
      const parsedUpload = await parseHextomUpload(file, {
        requireNewProductPriceSheet: generationMode === "full",
      });

      setMultiUpload({
        fileName: file.name,
        ...parsedUpload,
        error: "",
      });
    } catch (error) {
      setMultiUpload({
        fileName: file.name,
        groups: [],
        warnings: [],
        summary: null,
        error: error.message,
      });
    } finally {
      setIsParsingUpload(false);
    }
  }

  const isMultiMode = mode === "multi";
  const isAddColorMode = generationMode === "add-color";
  const hasIncompatibleNewProductUpload =
    isMultiMode &&
    !isAddColorMode &&
    multiUpload.groups.length > 0 &&
    multiUpload.inputFormat !== "new-product-prices";
  const activeMultiGroups = hasIncompatibleNewProductUpload
    ? []
    : multiUpload.groups;
  const activeMultiSummary = hasIncompatibleNewProductUpload
    ? null
    : multiUpload.summary;
  const multiUploadError = hasIncompatibleNewProductUpload
    ? "Upload a New Product Price Sheet before generating New Product variants."
    : multiUpload.error;
  const exportOptions = {
    ...newProductExportOptions,
    isNewProduct: !isAddColorMode,
  };
  const detectedTextures = getDetectedTextures(activeMultiGroups, textures);
  const activeTextures = isMultiMode ? detectedTextures : selectedTextures;
  const manufacturerColors = selectedMfgr
    ? colors.filter((color) => color.codes?.[selectedMfgr.code])
    : colors;
  const effectiveExistingColors = selectedExistingColors.filter(
    (existingColor) =>
      !selectedNewColors.some((newColor) => newColor.name === existingColor.name),
  );

  const singleVariants = generateVariants({
    selectedMfgr,
    parentSku,
    selectedColors,
    selectedTextures,
    pricesByTexture,
    selectedDtBaseColors,
    generationMode,
    selectedNewColors,
    selectedExistingColors: effectiveExistingColors,
  });
  const multiVariants = generateMultiVariants({
    groups: activeMultiGroups,
    textures,
    selectedMfgr,
    selectedColors,
    selectedDtBaseColors,
    generationMode,
    selectedNewColors,
    selectedExistingColors: effectiveExistingColors,
  });
  const uploadWarnings = hasIncompatibleNewProductUpload
    ? []
    : [
        ...multiUpload.warnings,
        ...getAbsolutePriceSuggestions(activeMultiGroups, selectedMfgr),
      ];
  const variants = isMultiMode ? multiVariants : singleVariants;
  const exportableProductCount =
    activeMultiSummary?.exportableProductCount ?? activeMultiSummary?.productCount;
  const variantsPerProduct =
    isMultiMode && exportableProductCount
      ? variants.length / exportableProductCount
      : 0;
  const previewSummary =
    isMultiMode && activeMultiSummary
      ? {
          importedProductCount: activeMultiSummary.productCount,
          productCount: exportableProductCount,
          excludedProductCount: activeMultiSummary.excludedProductCount,
          variantsPerProduct: Number.isInteger(variantsPerProduct)
            ? variantsPerProduct
            : `${variantsPerProduct.toFixed(1)} avg`,
        }
      : null;
  const exportFileName = isMultiMode
    ? `${multiUpload.fileName.replace(/\.[^.]+$/, "") || "multi"}-variants`
    : "";

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Hold Variant Tool</h1>
      </header>

      <div className="workspace">
        <div className="setup-panel">
          <ModeToggle mode={mode} setMode={setMode} />
          <GenerationModeToggle
            generationMode={generationMode}
            setGenerationMode={setGenerationMode}
          />

          {isMultiMode ? (
            <>
              <HextomUpload
                fileName={multiUpload.fileName}
                error={multiUploadError}
                isParsing={isParsingUpload}
                summary={activeMultiSummary}
                onFileChange={updateHextomUpload}
                isNewProductMode={!isAddColorMode}
              />
              <UploadWarnings warnings={uploadWarnings} />
            </>
          ) : (
            <ParentSkuInput parentSku={parentSku} setParentSku={setParentSku} />
          )}

          <MfgrSelector
            manufacturers={manufacturers}
            selectedMfgr={selectedMfgr}
            setSelectedMfgr={updateSelectedMfgr}
          />

          {isAddColorMode ? (
            <>
              <ColorSelector
                title="Existing Companion Colors"
                colors={manufacturerColors.filter(
                  (color) =>
                    !selectedNewColors.some(
                      (newColor) => newColor.name === color.name,
                    ),
                )}
                selectedColors={effectiveExistingColors}
                setSelectedColors={setSelectedExistingColors}
                emptyMessage="Select a manufacturer to choose companion colors."
              />
              <ColorSelector
                title="New Colors"
                colors={manufacturerColors}
                selectedColors={selectedNewColors}
                setSelectedColors={setSelectedNewColors}
                emptyMessage="Select a manufacturer to choose new colors."
              />
            </>
          ) : (
            <ColorSelector
              colors={manufacturerColors}
              selectedColors={selectedColors}
              setSelectedColors={setSelectedColors}
            />
          )}

          {isMultiMode ? (
            <section className="tool-section">
              <h2>Detected Textures</h2>
              {detectedTextures.length === 0 ? (
                <p className="empty-state">
                  {isAddColorMode
                    ? "Upload a Hextom export with Option value 1 containing DT, FT, or DP."
                    : "Upload a New Product price sheet with FT price, DT price, and/or DP price columns."}
                </p>
              ) : (
                <div className="detected-textures">
                  {detectedTextures.map((texture) => (
                    <span key={texture.code}>{texture.code}</span>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <TextureSelector
              textures={textures}
              selectedTextures={selectedTextures}
              setSelectedTextures={setSelectedTextures}
              selectedMfgr={selectedMfgr}
            />
          )}

          <DtBaseColorSelector
            selectedMfgr={selectedMfgr}
            selectedColors={isAddColorMode ? selectedNewColors : selectedColors}
            selectedTextures={activeTextures}
            selectedDtBaseColors={selectedDtBaseColors}
            setSelectedDtBaseColors={setSelectedDtBaseColors}
            colorOptions={isAddColorMode ? manufacturerColors : selectedColors}
            emptyMessage={
              isAddColorMode
                ? "Select a manufacturer to choose DT base colors."
                : "Select colors to choose DT bases."
            }
          />

          {!isMultiMode && (
            <TexturePriceInputs
              selectedTextures={selectedTextures}
              pricesByTexture={pricesByTexture}
              setPricesByTexture={setPricesByTexture}
            />
          )}

          {!isMultiMode && (
            <WeightInput weight={weight} setWeight={setWeight} />
          )}

          {!isAddColorMode && (
            <InventoryExportOptions
              options={newProductExportOptions}
              setOptions={setNewProductExportOptions}
              isMultiMode={isMultiMode}
            />
          )}
        </div>

        <div className="preview-panel">
          <VariantPreview
            variants={variants}
            parentSku={parentSku}
            weight={weight}
            exportOptions={exportOptions}
            summary={previewSummary}
            actions={
              <>
                <CsvPreviewButton
                  variants={variants}
                  parentSku={parentSku}
                  weight={weight}
                  exportOptions={exportOptions}
                />
                <CsvDownloadButton
                  variants={variants}
                  parentSku={parentSku}
                  weight={weight}
                  exportOptions={exportOptions}
                  fileName={exportFileName}
                />
              </>
            }
          />
        </div>
      </div>
    </main>
  );
}

export default App;


