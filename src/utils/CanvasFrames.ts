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

/**
 * Reorder a frame from one index to another.
 */
export const reorderFrame = (
  artwork: Artwork,
  fromIndex: number,
  toIndex: number,
): Artwork => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= artwork.frames.length ||
    toIndex >= artwork.frames.length
  )
    return artwork;

  // Reorder frame durations
  const newFrames = [...artwork.frames];
  const [movedDuration] = newFrames.splice(fromIndex, 1);
  newFrames.splice(toIndex, 0, movedDuration);

  // Reorder each layer's frame data
  const newLayers = artwork.layers.map((layer) => {
    const newLayerFrames = [...layer.frames];
    const [movedFrame] = newLayerFrames.splice(fromIndex, 1);
    newLayerFrames.splice(toIndex, 0, movedFrame);
    return { ...layer, frames: newLayerFrames };
  });

  // Update animation group indices
  const groups = (artwork.groups ?? []).map((g) => ({
    ...g,
    frameIndices: g.frameIndices.map((fi) => {
      if (fi === fromIndex) return toIndex;
      if (fromIndex < toIndex) {
        // Moved right: indices between (from, to] shift left
        if (fi > fromIndex && fi <= toIndex) return fi - 1;
      } else {
        // Moved left: indices between [to, from) shift right
        if (fi >= toIndex && fi < fromIndex) return fi + 1;
      }
      return fi;
    }),
  }));

  return { ...artwork, frames: newFrames, layers: newLayers, groups };
};

/**
 * Delete multiple frames at once. Indices are processed in descending order
 * so earlier indices remain valid.
 */
export const deleteFrames = (
  artwork: Artwork,
  frameIndices: number[],
): Artwork => {
  // Must keep at least 1 frame
  const toDelete = frameIndices
    .filter((i) => i >= 0 && i < artwork.frames.length)
    .sort((a, b) => b - a); // descending

  if (toDelete.length >= artwork.frames.length) {
    // Keep at least one — remove all except the first remaining
    toDelete.pop();
  }

  let result = artwork;
  for (const idx of toDelete) {
    result = deleteFrame(result, idx);
  }
  return result;
};

/**
 * Duplicate multiple frames at once. New frames are inserted after the
 * last selected frame.
 */
export const duplicateFrames = (
  artwork: Artwork,
  frameIndices: number[],
): Artwork => {
  const sorted = [...frameIndices].sort((a, b) => a - b);
  let result = artwork;
  let offset = 0;

  for (const idx of sorted) {
    result = duplicateFrame(result, idx + offset);
    offset++; // each duplication shifts subsequent indices
  }
  return result;
};

/**
 * Change timing for multiple frames.
 */
export const changeFramesTimingBatch = (
  artwork: Artwork,
  frameIndices: number[],
  newTiming: number,
): Artwork => {
  const newFrames = [...artwork.frames];
  for (const idx of frameIndices) {
    if (idx >= 0 && idx < newFrames.length) {
      newFrames[idx] = newTiming;
    }
  }
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
