import { Artwork } from "@/types/canvas";

export const addNewFrame = (
  artwork: Artwork,
  selectedFrame: number,
): Artwork => {
  const newFrames = [...artwork.frames];
  newFrames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);

  const newLayers = artwork.layers.map((layer) => {
    const newLayerFrames = [...layer.frames];
    // Insert a null frame at selectedFrame + 1
    newLayerFrames.splice(selectedFrame + 1, 0, null);
    return { ...layer, frames: newLayerFrames };
  });

  return { ...artwork, frames: newFrames, layers: newLayers };
};

export const deleteFrame = (
  artwork: Artwork,
  selectedFrame: number,
): Artwork => {
  if (
    artwork.frames.length === 1 ||
    selectedFrame >= artwork.frames.length ||
    selectedFrame < 0
  )
    return artwork;

  const newFrames = [...artwork.frames];
  newFrames.splice(selectedFrame, 1);

  const newLayers = artwork.layers.map((layer) => {
    const newLayerFrames = [...layer.frames];
    newLayerFrames.splice(selectedFrame, 1);
    return { ...layer, frames: newLayerFrames };
  });

  return { ...artwork, frames: newFrames, layers: newLayers };
};

export const duplicateFrame = (
  artwork: Artwork,
  selectedFrame: number,
): Artwork => {
  const newFrames = [...artwork.frames];
  newFrames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);

  const newLayers = artwork.layers.map((layer) => {
    const newLayerFrames = [...layer.frames];
    const sourceFrame = layer.frames[selectedFrame];
    // Deep-copy ImageData
    const copiedFrame = sourceFrame
      ? new ImageData(
          new Uint8ClampedArray(sourceFrame.data),
          sourceFrame.width,
          sourceFrame.height,
        )
      : null;
    newLayerFrames.splice(selectedFrame + 1, 0, copiedFrame);
    return { ...layer, frames: newLayerFrames };
  });

  return { ...artwork, frames: newFrames, layers: newLayers };
};

export const changeFrameTiming = (
  artwork: Artwork,
  selectedFrame: number,
  newFrameTiming: number,
): Artwork => {
  if (selectedFrame >= artwork.frames.length) return artwork;
  const newFrames = [...artwork.frames];
  newFrames[selectedFrame] = newFrameTiming;
  return { ...artwork, frames: newFrames };
};

export const isFrameEmpty = (frame: ImageData | null): boolean => {
  if (!frame) return true;

  // Only check alpha channel (every 4th byte) — 4x faster than checking all bytes
  const data = frame.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
};
