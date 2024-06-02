import { Layer } from "@/types/canvas";
import { generateLayerID } from "@/utilities/LayerUtils";

export const NewArtLayer: Layer = {
  id: generateLayerID("Layer 1"),
  name: "Layer 1",
  opacity: 1,
  visible: true,
  frames: {
    1: null,
  },
};
