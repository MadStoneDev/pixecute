import { Artwork, Layer } from "@/types/canvas";

export const createEmptyFrame = () => {
  if (ImageData) {
    return new ImageData(1, 1);
  }
  return null;
};

export const NewLayer: Layer = {
  name: "Layer",
  opacity: 100,
  visible: true,
  locked: false,
  frames: { 1: null },
};

export const NewArtwork: Artwork = {
  layers: [NewLayer],
  frames: [100],
  keyIdentifier: "",
};
