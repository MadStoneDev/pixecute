import { Artwork } from "@/types/canvas";
import { hexToRgb, rgbToHex } from "@/utils/Colour";

// --- Drawing Context ---
export interface DrawContext {
  artwork: Artwork;
  layer: number;
  frame: number;
  position: { x: number; y: number };
  startPosition: { x: number; y: number };
  colour: string;
  alpha: number;
  canvasSize: { width: number; height: number };
  setSelectedColour: (colour: string) => void;
  setCurrentAlpha: (alpha: number) => void;
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void;
  hudCanvas: HTMLCanvasElement | null;
  startingSnapshot: ImageData;
  moveAllLayers: boolean;
  originalSelectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  allLayersStartingSnapshots?: ImageData[];
  // Cached RGB colour (convert once per stroke, not per pixel)
  cachedRgb?: { r: number; g: number; b: number };
}

export const activateDrawingTool = (ctx: DrawContext, toolId: string) => {
  // Ensure we have cached RGB
  if (!ctx.cachedRgb) {
    ctx.cachedRgb = hexToRgb(ctx.colour);
  }

  switch (toolId) {
    case "select":
      selectAtPixel(ctx);
      break;
    case "pencil":
      drawAtPixel(ctx);
      break;
    case "picker":
      pickerAtPixel(ctx);
      break;
    case "eraser":
      eraseAtPixel(ctx);
      break;
    case "fill":
      fillAtPixel(ctx);
      break;
    case "move":
      moveAtPixel(ctx);
      break;
    case "line":
      lineToolDraw(ctx);
      break;
    case "rectangle":
      rectangleToolDraw(ctx);
      break;
  }

  return ctx.artwork;
};

// --- Select Tool ---
const selectAtPixel = (ctx: DrawContext) => {
  const { hudCanvas, canvasSize, position, startPosition, setSelectedArea } =
    ctx;
  if (!hudCanvas) return;

  const hudCtx = hudCanvas.getContext("2d", { willReadFrequently: true });
  if (!hudCtx) return;

  hudCtx.imageSmoothingEnabled = false;
  hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

  const scaleFactor = hudCanvas.width / canvasSize.width;

  const startX = Math.min(startPosition.x, position.x);
  const startY = Math.min(startPosition.y, position.y);
  const endX = Math.max(startPosition.x, position.x);
  const endY = Math.max(startPosition.y, position.y);

  setSelectedArea({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  });

  const rectX = startX * scaleFactor;
  const rectY = startY * scaleFactor;
  const rectWidth = (endX - startX + 1) * scaleFactor;
  const rectHeight = (endY - startY + 1) * scaleFactor;

  hudCtx.fillStyle = "rgba(255, 255, 255, 0.25)";
  hudCtx.fillRect(rectX, rectY, rectWidth, rectHeight);

  hudCtx.globalAlpha = 1;
  hudCtx.strokeStyle = "rgba(199, 63, 88, 1)";
  hudCtx.lineWidth = 2;
  hudCtx.setLineDash([3, 6, 6, 6, 3, 0]);
  hudCtx.strokeRect(rectX, rectY, rectWidth, rectHeight);

  const dotSize = 2;
  hudCtx.fillStyle = "rgba(199, 63, 88, 1)";
  hudCtx.setLineDash([]);
  hudCtx.fillRect(rectX - dotSize / 2, rectY - dotSize / 2, dotSize, dotSize);
  hudCtx.fillRect(
    rectX + rectWidth - dotSize / 2,
    rectY - dotSize / 2,
    dotSize,
    dotSize,
  );
  hudCtx.fillRect(
    rectX - dotSize / 2,
    rectY + rectHeight - dotSize / 2,
    dotSize,
    dotSize,
  );
  hudCtx.fillRect(
    rectX + rectWidth - dotSize / 2,
    rectY + rectHeight - dotSize / 2,
    dotSize,
    dotSize,
  );
};

// --- Pencil Tool (direct buffer manipulation) ---
const drawAtPixel = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, canvasSize, alpha, cachedRgb } = ctx;
  const { x, y } = position;
  const { width, height } = canvasSize;

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  let imageData = artwork.layers[layer].frames[frame];
  if (!imageData || imageData.width !== width || imageData.height !== height) {
    imageData = new ImageData(width, height);
    artwork.layers[layer].frames[frame] = imageData;
  }

  const rgb = cachedRgb || hexToRgb(ctx.colour);
  const idx = (y * width + x) * 4;
  const data = imageData.data;

  // Alpha blending
  const srcA = Math.round(alpha * 255);
  if (srcA === 255) {
    data[idx] = rgb.r;
    data[idx + 1] = rgb.g;
    data[idx + 2] = rgb.b;
    data[idx + 3] = 255;
  } else {
    const dstA = data[idx + 3];
    const srcAf = srcA / 255;
    const dstAf = dstA / 255;
    const outAf = srcAf + dstAf * (1 - srcAf);
    if (outAf > 0) {
      data[idx] = Math.round(
        (rgb.r * srcAf + data[idx] * dstAf * (1 - srcAf)) / outAf,
      );
      data[idx + 1] = Math.round(
        (rgb.g * srcAf + data[idx + 1] * dstAf * (1 - srcAf)) / outAf,
      );
      data[idx + 2] = Math.round(
        (rgb.b * srcAf + data[idx + 2] * dstAf * (1 - srcAf)) / outAf,
      );
      data[idx + 3] = Math.round(outAf * 255);
    }
  }
};

// --- Eraser Tool (direct buffer manipulation) ---
const eraseAtPixel = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, canvasSize } = ctx;
  const { x, y } = position;
  const { width, height } = canvasSize;

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  let imageData = artwork.layers[layer].frames[frame];
  if (!imageData || imageData.width !== width || imageData.height !== height) {
    return; // nothing to erase
  }

  const idx = (y * width + x) * 4;
  imageData.data[idx] = 0;
  imageData.data[idx + 1] = 0;
  imageData.data[idx + 2] = 0;
  imageData.data[idx + 3] = 0;
};

// --- Picker Tool ---
const pickerAtPixel = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, setSelectedColour, setCurrentAlpha } =
    ctx;

  const imageData = artwork.layers[layer].frames[frame];
  if (!imageData) return;

  const { x, y } = position;
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return;

  const idx = (y * imageData.width + x) * 4;
  const data = imageData.data;
  const r = data[idx],
    g = data[idx + 1],
    b = data[idx + 2],
    a = data[idx + 3];

  setCurrentAlpha(a / 255);
  setSelectedColour(rgbToHex({ r, g, b }));
};

// --- Fill Tool (direct buffer flood fill) ---
const fillAtPixel = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, canvasSize, alpha, cachedRgb } = ctx;
  const { width, height } = canvasSize;
  const { x: startX, y: startY } = position;

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  let imageData = artwork.layers[layer].frames[frame];
  if (!imageData || imageData.width !== width || imageData.height !== height) {
    imageData = new ImageData(width, height);
    artwork.layers[layer].frames[frame] = imageData;
  }

  const data = imageData.data;
  const rgb = cachedRgb || hexToRgb(ctx.colour);
  const fillA = Math.round(alpha * 255);

  // Get initial colour at click position
  const startIdx = (startY * width + startX) * 4;
  const initR = data[startIdx],
    initG = data[startIdx + 1],
    initB = data[startIdx + 2],
    initA = data[startIdx + 3];

  // Don't fill if clicking on same colour
  if (
    initR === rgb.r &&
    initG === rgb.g &&
    initB === rgb.b &&
    initA === fillA
  ) {
    return;
  }

  const checked = new Uint8Array(width * height);
  const stack: number[] = [startX, startY];

  while (stack.length > 0) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;

    const pixelIdx = cy * width + cx;
    if (checked[pixelIdx]) continue;
    checked[pixelIdx] = 1;

    const bufIdx = pixelIdx * 4;

    // Check if this pixel matches the initial colour
    if (
      data[bufIdx] !== initR ||
      data[bufIdx + 1] !== initG ||
      data[bufIdx + 2] !== initB ||
      data[bufIdx + 3] !== initA
    ) {
      continue;
    }

    // Set pixel directly
    data[bufIdx] = rgb.r;
    data[bufIdx + 1] = rgb.g;
    data[bufIdx + 2] = rgb.b;
    data[bufIdx + 3] = fillA;

    // Push neighbors
    if (cx > 0) {
      stack.push(cx - 1, cy);
    }
    if (cx < width - 1) {
      stack.push(cx + 1, cy);
    }
    if (cy > 0) {
      stack.push(cx, cy - 1);
    }
    if (cy < height - 1) {
      stack.push(cx, cy + 1);
    }
  }
};

// --- Move Tool ---
const moveAtPixel = (ctx: DrawContext) => {
  const {
    artwork,
    layer: selectedLayer,
    frame: selectedFrame,
    position,
    startPosition,
    canvasSize,
    startingSnapshot,
    moveAllLayers,
    setSelectedArea,
    originalSelectedArea,
    hudCanvas,
    allLayersStartingSnapshots,
  } = ctx;

  const deltaX = position.x - startPosition.x;
  const deltaY = position.y - startPosition.y;
  const diff = { x: Math.round(deltaX), y: Math.round(deltaY) };

  const hasSelection =
    originalSelectedArea.start.x !== originalSelectedArea.end.x ||
    originalSelectedArea.start.y !== originalSelectedArea.end.y;

  if (hasSelection) {
    const layersToMove = moveAllLayers
      ? artwork.layers.map((_, i) => i)
      : [selectedLayer];

    layersToMove.forEach((layerIndex) => {
      const layerSnapshot =
        moveAllLayers && allLayersStartingSnapshots
          ? allLayersStartingSnapshots[layerIndex]
          : startingSnapshot;

      moveSelectedArea(
        layerSnapshot,
        originalSelectedArea,
        diff,
        canvasSize,
        artwork,
        layerIndex,
        selectedFrame,
      );
    });

    setSelectedArea({
      start: {
        x: originalSelectedArea.start.x + diff.x,
        y: originalSelectedArea.start.y + diff.y,
      },
      end: {
        x: originalSelectedArea.end.x + diff.x,
        y: originalSelectedArea.end.y + diff.y,
      },
    });

    redrawSelectionBox(
      {
        start: {
          x: originalSelectedArea.start.x + diff.x,
          y: originalSelectedArea.start.y + diff.y,
        },
        end: {
          x: originalSelectedArea.end.x + diff.x,
          y: originalSelectedArea.end.y + diff.y,
        },
      },
      hudCanvas,
      canvasSize,
    );
  } else {
    const layersToMove = moveAllLayers
      ? artwork.layers.map((_, i) => i)
      : [selectedLayer];

    layersToMove.forEach((layerIndex) => {
      const layerSnapshot =
        moveAllLayers && allLayersStartingSnapshots
          ? allLayersStartingSnapshots[layerIndex]
          : startingSnapshot;

      moveEntireLayer(
        layerSnapshot,
        diff,
        canvasSize,
        artwork,
        layerIndex,
        selectedFrame,
      );
    });
  }
};

// --- Selection helpers ---
export const clearSelection = (
  hudCanvas: HTMLCanvasElement | null,
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void,
) => {
  if (hudCanvas) {
    const ctx = hudCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    }
  }
  setSelectedArea({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
};

const redrawSelectionBox = (
  selectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  hudCanvas: HTMLCanvasElement | null,
  canvasSize: { width: number; height: number },
) => {
  if (!hudCanvas) return;

  const ctx = hudCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

  if (
    selectedArea.start.x === selectedArea.end.x &&
    selectedArea.start.y === selectedArea.end.y
  ) {
    return;
  }

  const scaleFactor = hudCanvas.width / canvasSize.width;

  const rectX = selectedArea.start.x * scaleFactor;
  const rectY = selectedArea.start.y * scaleFactor;
  const rectWidth =
    (selectedArea.end.x - selectedArea.start.x + 1) * scaleFactor;
  const rectHeight =
    (selectedArea.end.y - selectedArea.start.y + 1) * scaleFactor;

  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(199, 63, 88, 1)";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 6, 6, 6, 3, 0]);
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

  const dotSize = 2;
  ctx.fillStyle = "rgba(199, 63, 88, 1)";
  ctx.setLineDash([]);
  ctx.fillRect(rectX - dotSize / 2, rectY - dotSize / 2, dotSize, dotSize);
  ctx.fillRect(
    rectX + rectWidth - dotSize / 2,
    rectY - dotSize / 2,
    dotSize,
    dotSize,
  );
  ctx.fillRect(
    rectX - dotSize / 2,
    rectY + rectHeight - dotSize / 2,
    dotSize,
    dotSize,
  );
  ctx.fillRect(
    rectX + rectWidth - dotSize / 2,
    rectY + rectHeight - dotSize / 2,
    dotSize,
    dotSize,
  );
};

const moveSelectedArea = (
  startingSnapshot: ImageData,
  originalSelectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  diff: { x: number; y: number },
  canvasSize: { width: number; height: number },
  artwork: Artwork,
  layerIndex: number,
  selectedFrame: number,
) => {
  if (!startingSnapshot || !(startingSnapshot instanceof ImageData)) return;

  const { width, height } = canvasSize;
  const srcData = startingSnapshot.data;
  const newImageData = new ImageData(width, height);
  const newData = newImageData.data;

  // Copy all original data
  newData.set(srcData);

  // Clear the selected area
  for (
    let y = originalSelectedArea.start.y;
    y <= originalSelectedArea.end.y;
    y++
  ) {
    for (
      let x = originalSelectedArea.start.x;
      x <= originalSelectedArea.end.x;
      x++
    ) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        newData[index + 3] = 0;
      }
    }
  }

  // Move non-transparent pixels from selection
  for (
    let y = originalSelectedArea.start.y;
    y <= originalSelectedArea.end.y;
    y++
  ) {
    for (
      let x = originalSelectedArea.start.x;
      x <= originalSelectedArea.end.x;
      x++
    ) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const sourceIndex = (y * width + x) * 4;
        const alpha = srcData[sourceIndex + 3];

        if (alpha > 0) {
          const newX = x + diff.x;
          const newY = y + diff.y;

          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            const targetIndex = (newY * width + newX) * 4;
            newData[targetIndex] = srcData[sourceIndex];
            newData[targetIndex + 1] = srcData[sourceIndex + 1];
            newData[targetIndex + 2] = srcData[sourceIndex + 2];
            newData[targetIndex + 3] = srcData[sourceIndex + 3];
          }
        }
      }
    }
  }

  artwork.layers[layerIndex].frames[selectedFrame] = newImageData;
};

const moveEntireLayer = (
  startingSnapshot: ImageData,
  diff: { x: number; y: number },
  canvasSize: { width: number; height: number },
  artwork: Artwork,
  layerIndex: number,
  selectedFrame: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
  ctx.putImageData(startingSnapshot, diff.x, diff.y);

  artwork.layers[layerIndex].frames[selectedFrame] = ctx.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );
};

// --- Bresenham Line Algorithm ---
export const bresenhamLine = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
};

// --- Get colour at pixel (from ImageData buffer directly) ---
export const getColourAtPixel = (
  x: number,
  y: number,
  imageData: ImageData,
) => {
  const idx = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[idx],
    g: imageData.data[idx + 1],
    b: imageData.data[idx + 2],
    a: imageData.data[idx + 3],
  };
};

// --- Line Tool ---
// Draws a line from startPosition to current position using Bresenham.
// On each move, restores from startingSnapshot and redraws the full line preview.
const lineToolDraw = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, startPosition, canvasSize, alpha, cachedRgb, startingSnapshot } = ctx;
  const { width, height } = canvasSize;
  const rgb = cachedRgb || hexToRgb(ctx.colour);
  const fillA = Math.round(alpha * 255);

  // Restore from snapshot (so we can redraw the line preview)
  if (startingSnapshot && startingSnapshot instanceof ImageData) {
    artwork.layers[layer].frames[frame] = new ImageData(
      new Uint8ClampedArray(startingSnapshot.data),
      startingSnapshot.width,
      startingSnapshot.height,
    );
  }

  let imageData = artwork.layers[layer].frames[frame];
  if (!imageData || imageData.width !== width || imageData.height !== height) {
    imageData = new ImageData(width, height);
    artwork.layers[layer].frames[frame] = imageData;
  }

  const data = imageData.data;
  const points = bresenhamLine(startPosition.x, startPosition.y, position.x, position.y);

  for (const p of points) {
    if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) continue;
    const idx = (p.y * width + p.x) * 4;
    data[idx] = rgb.r;
    data[idx + 1] = rgb.g;
    data[idx + 2] = rgb.b;
    data[idx + 3] = fillA;
  }
};

// --- Rectangle Tool ---
// Draws an outline rectangle from startPosition to current position.
// On each move, restores from startingSnapshot and redraws the rectangle preview.
const rectangleToolDraw = (ctx: DrawContext) => {
  const { artwork, layer, frame, position, startPosition, canvasSize, alpha, cachedRgb, startingSnapshot } = ctx;
  const { width, height } = canvasSize;
  const rgb = cachedRgb || hexToRgb(ctx.colour);
  const fillA = Math.round(alpha * 255);

  // Restore from snapshot
  if (startingSnapshot && startingSnapshot instanceof ImageData) {
    artwork.layers[layer].frames[frame] = new ImageData(
      new Uint8ClampedArray(startingSnapshot.data),
      startingSnapshot.width,
      startingSnapshot.height,
    );
  }

  let imageData = artwork.layers[layer].frames[frame];
  if (!imageData || imageData.width !== width || imageData.height !== height) {
    imageData = new ImageData(width, height);
    artwork.layers[layer].frames[frame] = imageData;
  }

  const data = imageData.data;

  const x0 = Math.min(startPosition.x, position.x);
  const y0 = Math.min(startPosition.y, position.y);
  const x1 = Math.max(startPosition.x, position.x);
  const y1 = Math.max(startPosition.y, position.y);

  const setPixel = (px: number, py: number) => {
    if (px < 0 || px >= width || py < 0 || py >= height) return;
    const idx = (py * width + px) * 4;
    data[idx] = rgb.r;
    data[idx + 1] = rgb.g;
    data[idx + 2] = rgb.b;
    data[idx + 3] = fillA;
  };

  // Top and bottom edges
  for (let x = x0; x <= x1; x++) {
    setPixel(x, y0);
    setPixel(x, y1);
  }
  // Left and right edges
  for (let y = y0 + 1; y < y1; y++) {
    setPixel(x0, y);
    setPixel(x1, y);
  }
};
