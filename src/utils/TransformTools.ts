// utils/TransformTools.ts
import { Artwork } from "@/types/canvas";

/**
 * Flip a specific layer's current frame horizontally.
 */
export const flipHorizontal = (
  artwork: Artwork,
  layerIndex: number,
  frameIndex: number,
): Artwork => {
  const layer = artwork.layers[layerIndex];
  if (!layer) return artwork;
  const frame = layer.frames[frameIndex];
  if (!frame) return artwork;

  const { width, height, data } = frame;
  const newData = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (y * width + (width - 1 - x)) * 4;
      newData[dstIdx] = data[srcIdx];
      newData[dstIdx + 1] = data[srcIdx + 1];
      newData[dstIdx + 2] = data[srcIdx + 2];
      newData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  const newLayers = artwork.layers.map((l, i) => {
    if (i !== layerIndex) return l;
    const newFrames = [...l.frames];
    newFrames[frameIndex] = new ImageData(newData, width, height);
    return { ...l, frames: newFrames };
  });

  return { ...artwork, layers: newLayers };
};

/**
 * Flip a specific layer's current frame vertically.
 */
export const flipVertical = (
  artwork: Artwork,
  layerIndex: number,
  frameIndex: number,
): Artwork => {
  const layer = artwork.layers[layerIndex];
  if (!layer) return artwork;
  const frame = layer.frames[frameIndex];
  if (!frame) return artwork;

  const { width, height, data } = frame;
  const newData = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((height - 1 - y) * width + x) * 4;
      newData[dstIdx] = data[srcIdx];
      newData[dstIdx + 1] = data[srcIdx + 1];
      newData[dstIdx + 2] = data[srcIdx + 2];
      newData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  const newLayers = artwork.layers.map((l, i) => {
    if (i !== layerIndex) return l;
    const newFrames = [...l.frames];
    newFrames[frameIndex] = new ImageData(newData, width, height);
    return { ...l, frames: newFrames };
  });

  return { ...artwork, layers: newLayers };
};

/**
 * Rotate a specific layer's current frame 90° clockwise.
 * Note: Only works correctly on square canvases. For non-square,
 * the result is cropped/padded to maintain canvas dimensions.
 */
export const rotateCW = (
  artwork: Artwork,
  layerIndex: number,
  frameIndex: number,
): Artwork => {
  const layer = artwork.layers[layerIndex];
  if (!layer) return artwork;
  const frame = layer.frames[frameIndex];
  if (!frame) return artwork;

  const { width, height, data } = frame;
  // For pixel art, we keep the same canvas dimensions
  // and rotate content within bounds
  const outW = height;
  const outH = width;
  const newData = new Uint8ClampedArray(outW * outH * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      // CW rotation: (x, y) -> (height - 1 - y, x)
      const newX = height - 1 - y;
      const newY = x;
      const dstIdx = (newY * outW + newX) * 4;
      newData[dstIdx] = data[srcIdx];
      newData[dstIdx + 1] = data[srcIdx + 1];
      newData[dstIdx + 2] = data[srcIdx + 2];
      newData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  const newLayers = artwork.layers.map((l, i) => {
    if (i !== layerIndex) return l;
    const newFrames = [...l.frames];
    newFrames[frameIndex] = new ImageData(newData, outW, outH);
    return { ...l, frames: newFrames };
  });

  return { ...artwork, layers: newLayers };
};

/**
 * Rotate a specific layer's current frame 90° counter-clockwise.
 */
export const rotateCCW = (
  artwork: Artwork,
  layerIndex: number,
  frameIndex: number,
): Artwork => {
  const layer = artwork.layers[layerIndex];
  if (!layer) return artwork;
  const frame = layer.frames[frameIndex];
  if (!frame) return artwork;

  const { width, height, data } = frame;
  const outW = height;
  const outH = width;
  const newData = new Uint8ClampedArray(outW * outH * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      // CCW rotation: (x, y) -> (y, width - 1 - x)
      const newX = y;
      const newY = width - 1 - x;
      const dstIdx = (newY * outW + newX) * 4;
      newData[dstIdx] = data[srcIdx];
      newData[dstIdx + 1] = data[srcIdx + 1];
      newData[dstIdx + 2] = data[srcIdx + 2];
      newData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  const newLayers = artwork.layers.map((l, i) => {
    if (i !== layerIndex) return l;
    const newFrames = [...l.frames];
    newFrames[frameIndex] = new ImageData(newData, outW, outH);
    return { ...l, frames: newFrames };
  });

  return { ...artwork, layers: newLayers };
};
