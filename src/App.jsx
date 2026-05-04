import { useState } from "react";

import { colors } from "./data/colors";
import { textures } from "./data/textures";
import { generateVariants } from "./utils/generateVariants";
import { manufacturers } from "./data/manufacturers";
import "./App.css";

import MfgrSelector from "./components/MfgrSelector";
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

function App() {
  const [parentSku, setParentSku] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTextures, setSelectedTextures] = useState([]);
  const [selectedMfgr, setSelectedMfgr] = useState(null);
  const [pricesByTexture, setPricesByTexture] = useState({});
  const [weight, setWeight] = useState("");
  const [inventoryPolicyEnabled, setInventoryPolicyEnabled] = useState(false);
  const [inventoryTrackingEnabled, setInventoryTrackingEnabled] =
    useState(false);
  const [selectedDtBaseColors, setSelectedDtBaseColors] = useState([]);

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

  const variants = generateVariants({
    selectedMfgr,
    parentSku,
    selectedColors,
    selectedTextures,
    pricesByTexture,
    selectedDtBaseColors,
  });

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Hold Variant Tool</h1>
      </header>

      <div className="workspace">
        <div className="setup-panel">
          <ParentSkuInput parentSku={parentSku} setParentSku={setParentSku} />

          <MfgrSelector
            manufacturers={manufacturers}
            selectedMfgr={selectedMfgr}
            setSelectedMfgr={updateSelectedMfgr}
          />

          <ColorSelector
            colors={colors}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
          />

          <TextureSelector
            textures={textures}
            selectedTextures={selectedTextures}
            setSelectedTextures={setSelectedTextures}
            selectedMfgr={selectedMfgr}
          />

          <DtBaseColorSelector
            selectedMfgr={selectedMfgr}
            selectedColors={selectedColors}
            selectedTextures={selectedTextures}
            selectedDtBaseColors={selectedDtBaseColors}
            setSelectedDtBaseColors={setSelectedDtBaseColors}
          />

          <TexturePriceInputs
            selectedTextures={selectedTextures}
            pricesByTexture={pricesByTexture}
            setPricesByTexture={setPricesByTexture}
          />

          <WeightInput weight={weight} setWeight={setWeight} />

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
