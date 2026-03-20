// utils/CanvasResize.ts
import { Artwork } from "@/types/canvas";

/**
 * Anchor positions for canvas resize.
 * Content is placed relative to this anchor point in the new canvas.
 *
 *   TL  TC  TR
 *   ML  MC  MR
 *   BL  BC  BR
 */
export type AnchorPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Calculate the x,y offset for placing old content in the new canvas
 * based on the anchor position.
 */
const getAnchorOffset = (
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  anchor: AnchorPosition,
): { x: number; y: number } => {
  let x = 0;
  let y = 0;

  // Horizontal
  if (anchor.includes("left")) {
    x = 0;
  } else if (anchor.includes("right")) {
    x = newW - oldW;
  } else {
    // center
    x = Math.floor((newW - oldW) / 2);
  }

  // Vertical
  if (anchor.includes("top")) {
    y = 0;
  } else if (anchor.includes("bottom")) {
    y = newH - oldH;
  } else {
    // middle
    y = Math.floor((newH - oldH) / 2);
  }

  return { x, y };
};

/**
 * Resize the canvas of an artwork.
 * All layers and all frames are resized, with existing pixel data
 * placed according to the anchor position.
 */
export const resizeCanvas = (
  artwork: Artwork,
  newWidth: number,
  newHeight: number,
  anchor: AnchorPosition = "middle-center",
): Artwork => {
  if (newWidth < 1 || newHeight < 1) return artwork;

  // Get current dimensions from first available frame
  const firstFrame = artwork.layers[0]?.frames[0];
  const oldWidth = firstFrame?.width ?? newWidth;
  const oldHeight = firstFrame?.height ?? newHeight;

  if (oldWidth === newWidth && oldHeight === newHeight) return artwork;

  const { x: offsetX, y: offsetY } = getAnchorOffset(
    oldWidth,
    oldHeight,
    newWidth,
    newHeight,
    anchor,
  );

  const newLayers = artwork.layers.map((layer) => {
    const newFrames = layer.frames.map((frame) => {
      if (!frame) {
        return new ImageData(newWidth, newHeight);
      }

      const newData = new ImageData(newWidth, newHeight);
      const srcData = frame.data;
      const dstData = newData.data;

      // Copy pixels from old position to new position with offset
      for (let srcY = 0; srcY < oldHeight; srcY++) {
        for (let srcX = 0; srcX < oldWidth; srcX++) {
          const dstX = srcX + offsetX;
          const dstY = srcY + offsetY;

          // Skip if destination is out of bounds
          if (dstX < 0 || dstX >= newWidth || dstY < 0 || dstY >= newHeight) {
            continue;
          }

          const srcIdx = (srcY * oldWidth + srcX) * 4;
          const dstIdx = (dstY * newWidth + dstX) * 4;

          dstData[dstIdx] = srcData[srcIdx];
          dstData[dstIdx + 1] = srcData[srcIdx + 1];
          dstData[dstIdx + 2] = srcData[srcIdx + 2];
          dstData[dstIdx + 3] = srcData[srcIdx + 3];
        }
      }

      return newData;
    });

    return { ...layer, frames: newFrames };
  });

  return { ...artwork, layers: newLayers };
};
