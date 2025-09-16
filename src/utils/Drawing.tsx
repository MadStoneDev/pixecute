import { Artwork } from "@/types/canvas";
import { hexToRgb, rgbToHex } from "@/utils/Colour";
import { DRAWING_TOOLS } from "@/data/DefaultTools";

export const activateDrawingTool = (
  selectedTool = 0,
  selectedColour = "#000000",
  currentAlpha = 1,
  setCurrentAlpha: (alpha: number) => void,
  pixelSize: { x: number; y: number } = { x: 1, y: 1 },
  normalisedMousePosition: { x: number; y: number } = { x: 0, y: 0 },
  startingMousePosition: { x: number; y: number } = { x: 0, y: 0 },
  artwork: Artwork,
  selectedLayer: number = 0,
  selectedFrame: number = 0,
  currentCanvas: HTMLCanvasElement | OffscreenCanvas,
  currentContext: CanvasRenderingContext2D,
  setSelectedColour: (colour: string) => void,
  selectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void,
  canvasSize: { width: number; height: number } = { width: 16, height: 16 },
  startingSnapshot: ImageData = new ImageData(1, 1),
  hudCanvas: HTMLCanvasElement | null,
  floaterCanvas: HTMLCanvasElement | null,
  moveAllLayers: boolean = false, // New parameter for move tool setting
  originalSelectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  allLayersStartingSnapshots?: ImageData[],
) => {
  const ctx = currentContext;
  ctx!.imageSmoothingEnabled = false;

  const useImageData =
    artwork.layers[selectedLayer].frames[selectedFrame + 1] ||
    new ImageData(1, 1);
  ctx!.putImageData(useImageData, 0, 0);

  const activeTool = DRAWING_TOOLS[selectedTool].name.toLowerCase();

  if (activeTool === "select") {
    selectAtPixel(
      normalisedMousePosition,
      startingMousePosition,
      pixelSize,
      canvasSize,
      hudCanvas,
      setSelectedArea,
    );
  } else if (activeTool === "pencil") {
    drawAtPixel(
      normalisedMousePosition,
      pixelSize,
      canvasSize,
      artwork,
      selectedLayer,
      selectedFrame,
      selectedColour,
      currentAlpha,
    );
  } else if (activeTool === "picker") {
    pickerAtPixel(
      normalisedMousePosition,
      pixelSize,
      ctx,
      setSelectedColour,
      setCurrentAlpha,
    );
  } else if (activeTool === "eraser") {
    eraseAtPixel(
      normalisedMousePosition,
      pixelSize,
      canvasSize,
      artwork,
      selectedLayer,
      selectedFrame,
    );
  } else if (activeTool === "fill") {
    fillAtPixel(
      normalisedMousePosition,
      pixelSize,
      canvasSize,
      currentCanvas,
      ctx,
      artwork,
      selectedLayer,
      selectedFrame,
      selectedColour,
      currentAlpha,
    );
  } else if (activeTool === "move") {
    moveAtPixel(
      normalisedMousePosition,
      startingMousePosition,
      canvasSize,
      artwork,
      selectedLayer,
      selectedFrame,
      startingSnapshot,
      moveAllLayers,
      setSelectedArea,
      originalSelectedArea,
      hudCanvas,
      allLayersStartingSnapshots,
    );
  }

  return artwork;
};

const selectAtPixel = (
  mousePosition: { x: number; y: number },
  startingMousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  canvasSize: { width: number; height: number },
  hudCanvas: HTMLCanvasElement | null,
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void,
) => {
  if (hudCanvas === null) return;
  const hudWidth = hudCanvas.width;
  const hudHeight = hudCanvas.height;

  const ctx = hudCanvas.getContext("2d", { willReadFrequently: true });
  ctx!.imageSmoothingEnabled = false;
  if (ctx === null) return;

  ctx.clearRect(0, 0, hudWidth, hudHeight);
  const scaleFactor = hudWidth / canvasSize.width;

  const startX = Math.min(startingMousePosition.x, mousePosition.x);
  const startY = Math.min(startingMousePosition.y, mousePosition.y);
  const endX = Math.max(startingMousePosition.x, mousePosition.x);
  const endY = Math.max(startingMousePosition.y, mousePosition.y);

  // Update selected area state
  setSelectedArea({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  });

  const rectX = startX * scaleFactor * pixelSize.x;
  const rectY = startY * scaleFactor * pixelSize.y;
  const rectWidth = (endX - startX + 1) * scaleFactor * pixelSize.x;
  const rectHeight = (endY - startY + 1) * scaleFactor * pixelSize.y;

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

// Function to clear selection
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

export const drawAtPixel = (
  mousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  canvasSize: { width: number; height: number },
  artwork: Artwork,
  selectedLayer: number,
  selectedFrame: number,
  colour: string,
  currentAlpha: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx!.imageSmoothingEnabled = false;

  const getImageData =
    artwork.layers[selectedLayer].frames[selectedFrame + 1] ||
    new ImageData(1, 1);

  if (ctx) {
    ctx.putImageData(getImageData, 0, 0);

    const rgbaColour = { ...hexToRgb(colour), a: currentAlpha };
    ctx!.fillStyle = `rgba(${rgbaColour.r},${rgbaColour.g},${rgbaColour.b},${rgbaColour.a})`;
    ctx!.fillRect(
      mousePosition.x * pixelSize.x,
      mousePosition.y * pixelSize.y,
      pixelSize.x,
      pixelSize.y,
    );
  }

  artwork.layers[selectedLayer].frames[selectedFrame + 1] = ctx!.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );
};

export const pickerAtPixel = (
  mousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  setSelectedColour: (colour: string) => void,
  setCurrentAlpha: (alpha: number) => void,
) => {
  if (context === null) return;

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;

  const { r, g, b, a } = getColourAtPixel(
    mousePosition.x,
    mousePosition.y,
    pixelSize,
    ctx!,
  );
  setCurrentAlpha(a / 255); // Convert alpha to 0-1 range
  setSelectedColour(rgbToHex({ r, g, b }));
};

// Fixed eraser function - now updates the artwork data
const eraseAtPixel = (
  mousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  canvasSize: { width: number; height: number },
  artwork: Artwork,
  selectedLayer: number,
  selectedFrame: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx!.imageSmoothingEnabled = false;

  const getImageData =
    artwork.layers[selectedLayer].frames[selectedFrame + 1] ||
    new ImageData(canvasSize.width, canvasSize.height);

  if (ctx) {
    ctx.putImageData(getImageData, 0, 0);

    // Clear the specific pixel
    ctx.clearRect(
      mousePosition.x * pixelSize.x,
      mousePosition.y * pixelSize.y,
      pixelSize.x,
      pixelSize.y,
    );

    // Update the artwork data
    artwork.layers[selectedLayer].frames[selectedFrame + 1] = ctx.getImageData(
      0,
      0,
      canvasSize.width,
      canvasSize.height,
    );
  }
};

const fillAtPixel = (
  mousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  canvasSize: { width: number; height: number },
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  artwork: Artwork,
  selectedLayer: number,
  selectedFrame: number,
  colour: string,
  currentAlpha: number,
) => {
  if (context === null) return;

  const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const offscreenContext = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  offscreenContext!.imageSmoothingEnabled = false;

  offscreenContext.drawImage(canvas, 0, 0);

  const initialColour = getColourAtPixel(
    mousePosition.x,
    mousePosition.y,
    pixelSize,
    offscreenContext,
  );

  if (
    compareColours(initialColour, {
      ...hexToRgb(colour),
      a: Math.round(currentAlpha * 255),
    })
  )
    return;

  const checkedStack: Set<string> = new Set<string>();
  const pixelStack: { x: number; y: number }[] = [
    { x: mousePosition.x, y: mousePosition.y },
  ];

  while (pixelStack.length > 0) {
    const { x: currentX, y: currentY } = pixelStack.pop()!;
    const key = `${currentX},${currentY}`;

    if (checkedStack.has(key)) continue;
    checkedStack.add(key);

    drawAtPixel(
      { x: currentX, y: currentY },
      pixelSize,
      canvasSize,
      artwork,
      selectedLayer,
      selectedFrame,
      colour,
      currentAlpha,
    );

    const directions = [
      { x: -1, y: 0 }, // left
      { x: 0, y: -1 }, // top
      { x: 1, y: 0 }, // right
      { x: 0, y: 1 }, // bottom
    ];

    for (const { x: dX, y: dY } of directions) {
      const newPixel = {
        x: currentX + dX,
        y: currentY + dY,
      };

      const newKey = `${newPixel.x},${newPixel.y}`;

      if (
        newPixel.x >= 0 &&
        newPixel.x < canvas.width &&
        newPixel.y >= 0 &&
        newPixel.y < canvas.height &&
        !checkedStack.has(newKey)
      ) {
        const checkPixelColour = getColourAtPixel(
          newPixel.x,
          newPixel.y,
          pixelSize,
          offscreenContext,
        );

        if (compareColours(checkPixelColour, initialColour)) {
          pixelStack.push(newPixel);
        }
      }
    }
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(offscreenCanvas, 0, 0);
};

const moveAtPixel = (
  mousePosition: { x: number; y: number },
  startingMousePosition: { x: number; y: number },
  canvasSize: { width: number; height: number },
  artwork: Artwork,
  selectedLayer: number,
  selectedFrame: number,
  startingSnapshot: ImageData,
  moveAllLayers: boolean = false,
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void,
  originalSelectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  hudCanvas: HTMLCanvasElement | null,
  allLayersStartingSnapshots?: ImageData[],
) => {
  // Simple difference calculation - mouse movement = content movement
  const deltaX = mousePosition.x - startingMousePosition.x;
  const deltaY = mousePosition.y - startingMousePosition.y;

  // Round to prevent sub-pixel movement
  const diff = {
    x: Math.round(deltaX),
    y: Math.round(deltaY),
  };

  // Check if there's a selection using ORIGINAL coordinates
  const hasSelection =
    originalSelectedArea.start.x !== originalSelectedArea.end.x ||
    originalSelectedArea.start.y !== originalSelectedArea.end.y;

  if (hasSelection) {
    // Move only the selected area
    const layersToMove = moveAllLayers
      ? artwork.layers.map((_, index) => index)
      : [selectedLayer];

    layersToMove.forEach((layerIndex) => {
      // Use the appropriate starting snapshot for each layer
      const layerSnapshot =
        moveAllLayers && allLayersStartingSnapshots
          ? allLayersStartingSnapshots[layerIndex]
          : startingSnapshot;

      moveSelectedArea(
        layerSnapshot,
        originalSelectedArea, // Use ORIGINAL coordinates for extraction
        diff,
        canvasSize,
        artwork,
        layerIndex,
        selectedFrame,
      );
    });

    // Update selection area to follow the content (visual feedback only)
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

    // Redraw the selection box at new position
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
      hudCanvas, // You'll need to pass this to moveAtPixel
      canvasSize,
      { x: 1, y: 1 },
    );
  } else {
    // Move entire layer(s)
    const layersToMove = moveAllLayers
      ? artwork.layers.map((_, index) => index)
      : [selectedLayer];

    layersToMove.forEach((layerIndex) => {
      // Use the appropriate starting snapshot for each layer
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

const redrawSelectionBox = (
  selectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  },
  hudCanvas: HTMLCanvasElement | null,
  canvasSize: { width: number; height: number },
  pixelSize: { x: number; y: number } = { x: 1, y: 1 },
) => {
  if (!hudCanvas) return;

  const hudWidth = hudCanvas.width;
  const hudHeight = hudCanvas.height;
  const ctx = hudCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, hudWidth, hudHeight);

  // Only draw if there's an actual selection
  if (
    selectedArea.start.x === selectedArea.end.x &&
    selectedArea.start.y === selectedArea.end.y
  ) {
    return;
  }

  const scaleFactor = hudWidth / canvasSize.width;
  const startX = selectedArea.start.x;
  const startY = selectedArea.start.y;
  const endX = selectedArea.end.x;
  const endY = selectedArea.end.y;

  const rectX = startX * scaleFactor * pixelSize.x;
  const rectY = startY * scaleFactor * pixelSize.y;
  const rectWidth = (endX - startX + 1) * scaleFactor * pixelSize.x;
  const rectHeight = (endY - startY + 1) * scaleFactor * pixelSize.y;

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
  if (!startingSnapshot || !(startingSnapshot instanceof ImageData)) {
    console.warn("startingSnapshot is not an ImageData");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(startingSnapshot, 0, 0);

  const originalImageData = ctx.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );
  const data = originalImageData.data;

  const newImageData = ctx.createImageData(canvasSize.width, canvasSize.height);
  const newData = newImageData.data;

  // Copy all the original data first (preserves everything outside selection)
  for (let i = 0; i < data.length; i++) {
    newData[i] = data[i];
  }

  // Clear the selected area first
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
      if (x >= 0 && x < canvasSize.width && y >= 0 && y < canvasSize.height) {
        const index = (y * canvasSize.width + x) * 4;
        newData[index + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
  }

  // Move only non-transparent pixels from the selection
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
      if (x >= 0 && x < canvasSize.width && y >= 0 && y < canvasSize.height) {
        const sourceIndex = (y * canvasSize.width + x) * 4;
        const alpha = data[sourceIndex + 3];

        // Only move if pixel is not fully transparent
        if (alpha > 0) {
          const newX = x + diff.x;
          const newY = y + diff.y;

          // Check if new position is within bounds
          if (
            newX >= 0 &&
            newX < canvasSize.width &&
            newY >= 0 &&
            newY < canvasSize.height
          ) {
            const targetIndex = (newY * canvasSize.width + newX) * 4;

            // Copy the pixel to new position
            newData[targetIndex] = data[sourceIndex]; // R
            newData[targetIndex + 1] = data[sourceIndex + 1]; // G
            newData[targetIndex + 2] = data[sourceIndex + 2]; // B
            newData[targetIndex + 3] = data[sourceIndex + 3]; // A
          }
        }
      }
    }
  }

  // Apply the new image data
  ctx.putImageData(newImageData, 0, 0);

  // Save back to artwork
  artwork.layers[layerIndex].frames[selectedFrame + 1] = ctx.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );
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

  artwork.layers[layerIndex].frames[selectedFrame + 1] = ctx.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );
};

export const getColourAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const imageData = context.getImageData(
    x * pixelSize.x,
    y * pixelSize.y,
    1,
    1,
  ).data;

  const r = imageData[0],
    g = imageData[1],
    b = imageData[2],
    a = imageData[3];

  return { r, g, b, a };
};

const compareColours = (
  a: { r: number; g: number; b: number; a: number },
  b: { r: number; g: number; b: number; a: number },
) => {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
};
