import { useState } from "react";

import { colors } from "./data/colors";
import { textures } from "./data/textures";
import { generateVariants } from "./utils/generateVariants";
import {
  generateMultiVariants,
  getDetectedTextures,
} from "./utils/generateMultiVariants";
import { parseHextomUpload } from "./utils/parseHextomUpload";
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
      group.texture === "FT" &&
      price !== null &&
      !pricesByHandle.has(group.handle)
    ) {
      pricesByHandle.set(group.handle, price);
    }

    return pricesByHandle;
  }, new Map());

  return groups.reduce((expectedPrices, group) => {
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

function addAbsolutePriceGuides(warnings = [], groups = [], selectedMfgr) {
  const expectedPrices = getAbsoluteExpectedPrices(groups, selectedMfgr);

  if (expectedPrices.size === 0) {
    return warnings;
  }

  return warnings.map((warning) => {
    if (warning.type !== "price-conflict") {
      return warning;
    }

    return {
      ...warning,
      rows: warning.rows.map((row) => ({
        ...row,
        expectedPrice:
          expectedPrices.get(`${row.handle}|${row.texture}`) || row.expectedPrice,
      })),
    };
  });
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
  const [inventoryPolicyEnabled, setInventoryPolicyEnabled] = useState(false);
  const [inventoryTrackingEnabled, setInventoryTrackingEnabled] =
    useState(false);
  const [selectedDtBaseColors, setSelectedDtBaseColors] = useState([]);
  const [multiUpload, setMultiUpload] = useState({
    fileName: "",
    groups: [],
    warnings: [],
    summary: null,
    error: "",
  });
  const [isParsingUpload, setIsParsingUpload] = useState(false);

  const inventoryOptions = {
    policy: inventoryPolicyEnabled ? "continue" : "",
    tracking: inventoryTrackingEnabled ? "shopify" : "",
  };

  function updateSelectedMfgr(mfgr) {
    setSelectedMfgr(mfgr);

    if (mfgr.code === "compx") {
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
      const parsedUpload = await parseHextomUpload(file);

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
  const detectedTextures = getDetectedTextures(multiUpload.groups, textures);
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
    groups: multiUpload.groups,
    textures,
    selectedMfgr,
    selectedColors,
    selectedDtBaseColors,
    generationMode,
    selectedNewColors,
    selectedExistingColors: effectiveExistingColors,
  });
  const uploadWarnings = addAbsolutePriceGuides(
    multiUpload.warnings,
    multiUpload.groups,
    selectedMfgr,
  );
  const variants = isMultiMode ? multiVariants : singleVariants;
  const variantsPerProduct =
    isMultiMode && multiUpload.summary?.productCount
      ? variants.length / multiUpload.summary.productCount
      : 0;
  const previewSummary =
    isMultiMode && multiUpload.summary
      ? {
          productCount: multiUpload.summary.productCount,
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
                error={multiUpload.error}
                isParsing={isParsingUpload}
                summary={multiUpload.summary}
                onFileChange={updateHextomUpload}
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
                  Upload a Hextom export with Option value 1 containing DT, FT,
                  or DP.
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
            <>
              <TexturePriceInputs
                selectedTextures={selectedTextures}
                pricesByTexture={pricesByTexture}
                setPricesByTexture={setPricesByTexture}
              />

              <WeightInput weight={weight} setWeight={setWeight} />
            </>
          )}

          <InventoryExportOptions
            inventoryPolicyEnabled={inventoryPolicyEnabled}
            setInventoryPolicyEnabled={setInventoryPolicyEnabled}
            inventoryTrackingEnabled={inventoryTrackingEnabled}
            setInventoryTrackingEnabled={setInventoryTrackingEnabled}
          />
        </div>

        <div className="preview-panel">
          <VariantPreview
            variants={variants}
            parentSku={parentSku}
            weight={weight}
            inventoryOptions={inventoryOptions}
            summary={previewSummary}
            actions={
              <>
                <CsvPreviewButton
                  variants={variants}
                  parentSku={parentSku}
                  weight={weight}
                  inventoryOptions={inventoryOptions}
                />
                <CsvDownloadButton
                  variants={variants}
                  parentSku={parentSku}
                  weight={weight}
                  inventoryOptions={inventoryOptions}
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


