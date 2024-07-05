"use client";

import { Layer } from "@/types/canvas";
import { generateLayerID } from "@/utilities/LayerUtils";

export const createEmptyImageData = (): ImageData => {
  return new ImageData(1, 1);
};

export const NewArtLayer: Layer = {
  id: generateLayerID("Layer 1"),
  name: "Layer 1",
  opacity: 1,
  visible: true,
  locked: false,
  frames: {
    1: null,
  },
};
