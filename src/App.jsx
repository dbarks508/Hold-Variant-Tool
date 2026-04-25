import { useState } from "react";

import { colors } from "./data/colors";
import { textures } from "./data/textures";
import { generateVariants } from "./utils/generateVariants";
import { manufacturers } from "./data/manufacturers";

import MfgrSelector from "./components/MfgrSelector";
import ParentSkuInput from "./components/ParentSkuInput";
import ColorSelector from "./components/ColorSelector";
import TextureSelector from "./components/TextureSelector";
import VariantPreview from "./components/VariantPreview";
import CsvDownloadButton from "./components/CsvDownloadButton";
import TexturePriceInputs from "./components/TexturePriceInputs";

function App() {
  const [parentSku, setParentSku] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTextures, setSelectedTextures] = useState([]);
  const [selectedMfgr, setSelectedMfgr] = useState(null);
  const [pricesByTexture, setPricesByTexture] = useState({});

  const variants = generateVariants({
    selectedMfgr,
    parentSku,
    selectedColors,
    selectedTextures,
    pricesByTexture,
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Hold Variant Tool</h1>

      <ParentSkuInput parentSku={parentSku} setParentSku={setParentSku} />

      <MfgrSelector
        manufacturers={manufacturers}
        selectedMfgr={selectedMfgr}
        setSelectedMfgr={setSelectedMfgr}
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
      />

      <TexturePriceInputs
        selectedTextures={selectedTextures}
        pricesByTexture={pricesByTexture}
        setPricesByTexture={setPricesByTexture}
      />

      <VariantPreview variants={variants} />

      <CsvDownloadButton variants={variants} parentSku={parentSku} />
    </main>
  );
}

export default App;
