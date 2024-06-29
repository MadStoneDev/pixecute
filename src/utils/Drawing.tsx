import { Artwork } from "@/types/canvas";
import { hexToRgb, rgbToHex } from "@/utils/Colour";
import { DRAWING_TOOLS } from "@/data/DefaultTools";
import { saveArtwork } from "@/utils/IndexedDB";

export const activateDrawingTool = async (
  selectedTool = 0,
  selectedColour = "#000000",
  pixelSize: { x: number; y: number },
  mouseX = 0,
  mouseY = 0,
  artwork: Artwork,
  selectedLayer: number,
  selectedFrame: number,
  currentCanvas: HTMLCanvasElement | OffscreenCanvas,
  currentContext: CanvasRenderingContext2D,
  setSelectedColour: (colour: string) => void,
  canvasSize: { width: number; height: number },
) => {
  const ctx = currentContext;
  ctx!.imageSmoothingEnabled = false;

  const useImageData =
    artwork.layers[selectedLayer].frames[selectedFrame + 1] ||
    new ImageData(1, 1);
  ctx!.putImageData(useImageData, 0, 0);

  const activeTool = DRAWING_TOOLS[selectedTool].name.toLowerCase();

  if (activeTool === "pencil")
    drawAtPixel(mouseX, mouseY, pixelSize, selectedColour, ctx);
  else if (activeTool === "picker")
    pickerAtPixel(mouseX, mouseY, pixelSize, ctx, setSelectedColour);
  else if (activeTool === "eraser")
    eraseAtPixel(mouseX, mouseY, pixelSize, ctx);
  else if (activeTool === "fill")
    fillAtPixel(mouseX, mouseY, pixelSize, currentCanvas, ctx, selectedColour);

  artwork.layers[selectedLayer].frames[selectedFrame + 1] = ctx!.getImageData(
    0,
    0,
    canvasSize.width,
    canvasSize.height,
  );

  await saveArtwork(artwork);
  return artwork;
};

export const drawAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  colour: string,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
) => {
  if (context === null) return;

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;
  if (ctx === null) return;

  const rgbaColour = { ...hexToRgb(colour), a: 1 };
  ctx!.fillStyle = `rgba(${rgbaColour.r},${rgbaColour.g},${rgbaColour.b},${rgbaColour.a})`;
  ctx!.fillRect(x * pixelSize.x, y * pixelSize.y, pixelSize.x, pixelSize.y);
};

export const pickerAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  setSelectedColour: (colour: string) => void,
) => {
  if (context === null) return;

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;

  const { r, g, b, a } = getColourAtPixel(x, y, pixelSize, ctx!);
  setSelectedColour(rgbToHex({ r, g, b }));
};

const eraseAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
) => {
  if (context === null) return;

  const ctx = context;
  ctx!.imageSmoothingEnabled = false;
  ctx!.clearRect(x * pixelSize.x, y * pixelSize.y, pixelSize.x, pixelSize.y);
};

const fillAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
  colour: string,
) => {
  if (context === null) return;

  const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const offscreenContext = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  offscreenContext!.imageSmoothingEnabled = false;

  offscreenContext.drawImage(canvas, 0, 0);

  const initialColour = getColourAtPixel(x, y, pixelSize, offscreenContext);
  if (compareColours(initialColour, { ...hexToRgb(colour), a: 1 })) return;

  const pixelStack: { x: number; y: number }[] = [{ x, y }];
  const checkedStack: Set<string> = new Set<string>();

  while (pixelStack.length > 0) {
    const { x: currentX, y: currentY } = pixelStack.pop()!;
    drawAtPixel(currentX, currentY, pixelSize, colour, offscreenContext);

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

      const key = `${newPixel.x},${newPixel.y}`;

      if (
        newPixel.x >= 0 &&
        newPixel.x < canvas.width &&
        newPixel.y >= 0 &&
        newPixel.y < canvas.height &&
        !checkedStack.has(key)
      ) {
        const checkPixelColour = getColourAtPixel(
          newPixel.x,
          newPixel.y,
          pixelSize,
          offscreenContext,
        );

        if (compareColours(checkPixelColour, initialColour)) {
          pixelStack.push(newPixel);
          checkedStack.add(key);
        }
      }
    }
  }

  const ctx: OffscreenCanvasRenderingContext2D = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D;
  ctx!.imageSmoothingEnabled = false;
  ctx!.drawImage(offscreenCanvas, 0, 0);
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
