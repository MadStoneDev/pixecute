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
    );
  } else if (activeTool === "pencil")
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
  else if (activeTool === "picker")
    pickerAtPixel(
      normalisedMousePosition,
      pixelSize,
      ctx,
      setSelectedColour,
      setCurrentAlpha,
    );
  else if (activeTool === "eraser")
    eraseAtPixel(normalisedMousePosition, pixelSize, ctx);
  else if (activeTool === "fill")
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
  else if (activeTool === "move")
    moveAtPixel(
      normalisedMousePosition,
      startingMousePosition,
      canvasSize,
      ctx,
      startingSnapshot,
    );

  return artwork;
};

const selectAtPixel = (
  mousePosition: { x: number; y: number },
  startingMousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  canvasSize: { width: number; height: number },
  hudCanvas: HTMLCanvasElement | null,
) => {
  if (hudCanvas === null) return;
  const hudWidth = hudCanvas.width;
  const hudHeight = hudCanvas.height;

  const ctx = hudCanvas.getContext("2d", { willReadFrequently: true });
  ctx!.imageSmoothingEnabled = false;
  if (ctx === null) return;

  ctx.clearRect(0, 0, hudWidth, hudHeight);
  const scaleFactor = hudWidth / canvasSize.width;

  const startX =
    Math.min(startingMousePosition.x, mousePosition.x) *
    scaleFactor *
    pixelSize.x;
  const startY =
    Math.min(startingMousePosition.y, mousePosition.y) *
    scaleFactor *
    pixelSize.y;
  const endX =
    (Math.abs(startingMousePosition.x - mousePosition.x) + 1) *
    scaleFactor *
    pixelSize.x;
  const endY =
    (Math.abs(startingMousePosition.y - mousePosition.y) + 1) *
    scaleFactor *
    pixelSize.y;

  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(startX, startY, endX, endY);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(199, 63, 88, 1)";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 6, 6, 6, 3, 0]);
  ctx.strokeRect(startX, startY, endX, endY);

  const dotSize = 2;
  ctx.fillStyle = "rgba(199, 63, 88, 1)";

  ctx.setLineDash([]);
  ctx.fillRect(startX - dotSize / 2, startY - dotSize / 2, dotSize, dotSize);
  ctx.fillRect(
    startX + endX - dotSize / 2,
    startY - dotSize / 2,
    dotSize,
    dotSize,
  );
  ctx.fillRect(
    startX - dotSize / 2,
    startY + endY - dotSize / 2,
    dotSize,
    dotSize,
  );
  ctx.fillRect(
    startX + endX - dotSize / 2,
    startY + endY - dotSize / 2,
    dotSize,
    dotSize,
  );
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
  setCurrentAlpha(a);
  setSelectedColour(rgbToHex({ r, g, b }));
};

const eraseAtPixel = (
  mousePosition: { x: number; y: number },
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
) => {
  if (context === null) return;

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;
  ctx!.clearRect(
    mousePosition.x * pixelSize.x,
    mousePosition.y * pixelSize.y,
    pixelSize.x,
    pixelSize.y,
  );
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

  if (compareColours(initialColour, { ...hexToRgb(colour), a: currentAlpha }))
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
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  startingImage: ImageData = new ImageData(1, 1),
) => {
  if (context === null) return;
  const diff: { x: number; y: number } = {
    x: mousePosition.x - startingMousePosition.x,
    y: mousePosition.y - startingMousePosition.y,
  };

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;

  ctx!.clearRect(0, 0, canvasSize.width, canvasSize.height);
  ctx!.putImageData(startingImage, diff.x, diff.y);
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
