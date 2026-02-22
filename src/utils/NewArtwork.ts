import { Artwork, Layer } from "@/types/canvas";

export const createEmptyFrame = (): ImageData | null => {
  if (typeof ImageData !== "undefined") {
    return new ImageData(1, 1);
  }
  return null;
};

export const generateLayerId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const createNewLayer = (name: string = "Layer"): Layer => ({
  id: generateLayerId(),
  name,
  opacity: 1,
  visible: true,
  locked: false,
  frames: [null], // 0-indexed: one frame at index 0
});

export const NewLayer: Layer = createNewLayer("Layer");

export const NewArtwork: Artwork = {
  layers: [createNewLayer("Layer")],
  frames: [100], // frame durations in ms
  keyIdentifier: "",
};
