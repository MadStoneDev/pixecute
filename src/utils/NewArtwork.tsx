import { Artwork, Layer } from "@/types/canvas";

export const createEmptyFrame = () => {
  return new ImageData(1, 1);
};

export const NewLayer: Layer = {
  name: "Layer",
  opacity: 100,
  visible: true,
  locked: false,
  frames: { 1: createEmptyFrame() },
};

export const NewArtwork: Artwork = {
  layers: [NewLayer],
  frames: [100],
  keyIdentifier: "",
};
