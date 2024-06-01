import {
  colourObjectToRGBA,
  compareColourObjects,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
} from "@/utilities/ColourUtils";
import {
  ColourFormat,
  ColourObject,
  GetColourResponse,
  Layer,
} from "@/types/canvas";
import ImageData from "next/dist/server/lib/squoosh/image_data";
import { RefObject } from "react";
import { saveLayersToSession } from "@/utilities/LayerUtils";

// General Functions
// =================
const getImageFromSession = (key: string) => {
  return sessionStorage.getItem(key);
};

const saveImageToSession = (value: string) => {
  sessionStorage.setItem("currentImage", value);
};

// Art Related Functions
// =====================
const getColourAtPixel = (
  x: number,
  y: number,
  response: ColourFormat,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D,
): GetColourResponse => {
  const imageData = context.getImageData(
    x * pixelSize.x,
    y * pixelSize.y,
    1,
    1,
  ).data;

  switch (response) {
    case "raw":
      return imageData;
    case "hex":
      return {
        colour: rgbToHex({
          r: imageData[0],
          g: imageData[1],
          b: imageData[2],
        }).toUpperCase(),
        alpha: imageData[3],
      };
    case "rgb":
      return {
        colour: {
          r: imageData[0],
          g: imageData[1],
          b: imageData[2],
        },
        alpha: imageData[3],
      };
    case "hsl":
      return {
        colour: rgbToHsl({
          r: imageData[0],
          g: imageData[1],
          b: imageData[2],
        }),
        alpha: imageData[3],
      };
    default:
      return imageData;
  }
};

const drawTransparentGrid = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) => {
  const numCols = Math.ceil(width);
  const numRows = Math.ceil(height);
  const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      context.fillStyle =
        (row % 2 === 0) === (col % 2 === 0) ? "#a3a3a3" : "#525252";
      context.fillRect(
        Math.round(col),
        Math.round(row),
        Math.round(1),
        Math.round(1),
      );
    }
  }

  context.imageSmoothingEnabled = false;
};

const fillCanvas = (canvas: HTMLCanvasElement, background: string) => {
  const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

  switch (background) {
    case "black":
      context.fillStyle = "#000000";
      break;
    case "white":
      context.fillStyle = "#ffffff";
      break;
    default:
      return;
  }

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

    if (!layerCanvas) return;
    previewContext.drawImage(layerCanvas, 0, 0);
  });
};

// Art Tools Functions
// ===================
const drawPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  currentColour: ColourObject,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  layers: Layer[],
  activeLayer: number,
  activeFrame: number,
) => {
  let newColourRGBA = colourObjectToRGBA(currentColour);

  context.fillStyle = `rgba(${newColourRGBA})`;
  context.fillRect(
    Math.round(x * pixelSize.x),
    Math.round(y * pixelSize.y),
    Math.round(pixelSize.x),
    Math.round(pixelSize.y),
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  layers[activeLayer].frames[activeFrame] = imageData;

  // Save Layers to Session Storage
  saveLayersToSession(layers);
};

const pickerPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  context: CanvasRenderingContext2D,
) => {
  let pickedData = getColourAtPixel(
    x,
    y,
    "hex",
    pixelSize,
    context,
  ) as ColourObject;

  const newColour = pickedData.colour as string;
  return { colour: newColour.toUpperCase(), alpha: pickedData.alpha };
};

const erasePixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  layers: Layer[],
  activeLayer: number,
  activeFrame: number,
) => {
  context.clearRect(
    Math.round(x * pixelSize.x),
    Math.round(y * pixelSize.y),
    Math.round(pixelSize.x),
    Math.round(pixelSize.y),
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  layers[activeLayer].frames[activeFrame] = imageData;

  // Save Layers to Session Storage
  saveLayersToSession(layers);
};

const fillPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
  currentColour: ColourObject,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  layers: Layer[],
  activeLayer: number,
  activeFrame: number,
) => {
  const initialColour = getColourAtPixel(
    x,
    y,
    "hex",
    pixelSize,
    context,
  ) as ColourObject;

  if (compareColourObjects(initialColour, currentColour)) return;

  const pixelStack: { x: number; y: number }[] = [{ x, y }];
  const checkedStack: Set<string> = new Set();

  const addCheckedPixel = (pixel: { x: number; y: number }) => {
    checkedStack.add(`${pixel.x},${pixel.y}`);
  };

  while (pixelStack.length > 0) {
    const currentPixel: { x: number; y: number } = pixelStack.pop()!;
    drawPixel(
      currentPixel.x,
      currentPixel.y,
      pixelSize,
      currentColour,
      canvas,
      context,
      layers,
      activeLayer,
      activeFrame,
    );

    const directions = [
      { x: -1, y: 0 }, // left
      { x: 0, y: -1 }, // top
      { x: 1, y: 0 }, // right
      { x: 0, y: 1 }, // bottom
    ];

    for (const direction of directions) {
      const newPixel = {
        x: currentPixel.x + direction.x,
        y: currentPixel.y + direction.y,
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
          context,
        ) as ColourObject;

        if (compareColourObjects(checkPixelColour, initialColour)) {
          pixelStack.push(newPixel);
          addCheckedPixel(newPixel);
        }
      }
    }
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  layers[activeLayer].frames[activeFrame] = imageData;

  // Save Layers to Session Storage
  saveLayersToSession(layers);
};

export {
  getImageFromSession,
  saveImageToSession,
  getColourAtPixel,
  drawTransparentGrid,
  fillCanvas,
  updatePreviewWindow,
  drawPixel,
  pickerPixel,
  erasePixel,
  fillPixel,
};
