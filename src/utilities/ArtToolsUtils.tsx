import { RefObject } from "react";

import {
  Artwork,
  ArtworkObject,
  ColourFormat,
  ColourObject,
  GetColourResponse,
} from "@/types/canvas";

import {
  colourObjectToRGBA,
  compareColourObjects,
  rgbToHex,
  rgbToHsl,
} from "@/utilities/ColourUtils";
import { saveArtwork } from "@/utilities/IndexedUtils";

const ARTWORK_SESSION = "artworkObject";

// Art Related Functions
// =====================
const getColourAtPixel = (
  x: number,
  y: number,
  response: ColourFormat,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
): GetColourResponse => {
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

  switch (response) {
    case "raw":
      return imageData;
    case "hex":
      return {
        colour: rgbToHex({
          r,
          g,
          b,
        }).toUpperCase(),
        alpha: a,
      };
    case "rgb":
      return {
        colour: {
          r,
          g,
          b,
        },
        alpha: a,
      };
    case "hsl":
      return {
        colour: rgbToHsl({
          r,
          g,
          b,
        }),
        alpha: a,
      };
    default:
      return {
        colour: {
          r,
          g,
          b,
        },
        alpha: a,
      };
  }
};

const drawTransparentGrid = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) => {
  const context: CanvasRenderingContext2D = canvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  context.imageSmoothingEnabled = false;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      context.fillStyle =
        (row % 2 === 0) === (col % 2 === 0) ? "#a3a3a3" : "#525252";
      context.fillRect(col, row, 1, 1);
    }
  }
};

const fillCanvas = (canvas: HTMLCanvasElement, background: string) => {
  const context: CanvasRenderingContext2D = canvas.getContext("2d", {
    willReadFrequently: true,
  })!;

  context.fillStyle = background === "black" ? "#000000" : "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
};

const updatePreviewWindow = (
  backgroundCanvas: HTMLCanvasElement,
  previewContext: CanvasRenderingContext2D,
  layerRefs: RefObject<HTMLCanvasElement>[],
) => {
  if (!backgroundCanvas || !previewContext) return;

  // Clear Preview Canvas
  previewContext.clearRect(
    0,
    0,
    previewContext.canvas.width,
    previewContext.canvas.height,
  );

  //  Draw Background First
  previewContext.drawImage(backgroundCanvas, 0, 0);

  // Draw Layers
  layerRefs.forEach((layerRef) => {
    const layerCanvas = layerRef.current;

    if (layerCanvas) previewContext.drawImage(layerCanvas, 0, 0);
  });
};

const isImageDataEmpty = (imageData: ImageData) => {
  if (!imageData || imageData.width === 0 || imageData.height === 0)
    return true;

  return !imageData.data.some((value, index) => index % 4 !== 3 && value !== 0);
};

// Draw Tools Functions
// ===================
// Draw at Pixel
const drawAtPixel = async (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  currentColour: ColourObject,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  activeLayer: number,
  activeFrame: number,
) => {
  context.fillStyle = `rgba(${colourObjectToRGBA(currentColour)})`;
  context.fillRect(x * pixelSize.x, y * pixelSize.y, pixelSize.x, pixelSize.y);
  artworkObject.layers[activeLayer].frames[activeFrame] = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const newArtwork: Artwork = { ...artworkObject, keyIdentifier };
  await saveArtwork(newArtwork);
};

// Eye Drop Colour at Pixel
const pickerAtPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D,
) => {
  const { colour, alpha } = getColourAtPixel(
    x,
    y,
    "hex",
    pixelSize,
    context,
  ) as ColourObject;
  return { colour: (colour as string).toUpperCase(), alpha };
};

// Erase at Pixel
const eraseAtPixel = async (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  activeLayer: number,
  activeFrame: number,
) => {
  context.clearRect(x * pixelSize.x, y * pixelSize.y, pixelSize.x, pixelSize.y);
  artworkObject.layers[activeLayer].frames[activeFrame] = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const newArtwork: Artwork = { ...artworkObject, keyIdentifier };
  await saveArtwork(newArtwork);
};

// Fill Region at Pixel
const fillAtPixel = async (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
  currentColour: ColourObject,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  activeLayer: number,
  activeFrame: number,
) => {
  const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const offscreenContext = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  offscreenContext.drawImage(canvas, 0, 0);

  const initialColour = getColourAtPixel(
    x,
    y,
    "hex",
    pixelSize,
    offscreenContext,
  ) as ColourObject;

  if (compareColourObjects(initialColour, currentColour)) return;

  const pixelStack: { x: number; y: number }[] = [{ x, y }];
  const checkedStack: Set<string> = new Set<string>();

  while (pixelStack.length > 0) {
    const { x: currentX, y: currentY } = pixelStack.pop()!;
    await drawAtPixel(
      currentX,
      currentY,
      pixelSize,
      currentColour,
      offscreenCanvas,
      offscreenContext,
      artworkObject,
      keyIdentifier,
      activeLayer,
      activeFrame,
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

      const key = `${newPixel.x},${newPixel.y}`;

      if (
        newPixel.x >= 0 &&
        newPixel.x < canvasWidth &&
        newPixel.y >= 0 &&
        newPixel.y < canvasHeight &&
        !checkedStack.has(key)
      ) {
        const checkPixelColour = getColourAtPixel(
          newPixel.x,
          newPixel.y,
          "hex",
          pixelSize,
          offscreenContext,
        ) as ColourObject;

        if (compareColourObjects(checkPixelColour, initialColour)) {
          pixelStack.push(newPixel);
          checkedStack.add(key);
        }
      }
    }
  }

  context.drawImage(offscreenCanvas, 0, 0);
  artworkObject.layers[activeLayer].frames[activeFrame] = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const newArtwork: Artwork = { ...artworkObject, keyIdentifier };
  await saveArtwork(newArtwork);
};

export {
  getColourAtPixel,
  drawTransparentGrid,
  isImageDataEmpty,
  fillCanvas,
  updatePreviewWindow,
  drawAtPixel,
  pickerAtPixel,
  eraseAtPixel,
  fillAtPixel,
};
