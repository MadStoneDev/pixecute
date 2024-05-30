﻿import {
  colourObjectToRGBA,
  compareColourObjects,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
} from "@/utilities/ColourUtils";
import { ColourFormat, ColourObject, GetColourResponse } from "@/types/canvas";
import ImageData from "next/dist/server/lib/squoosh/image_data";

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

// Art Tools Functions
// ===================
const drawPixel = (
  x: number,
  y: number,
  pixelSize: { x: number; y: number },
  currentColour: ColourObject,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) => {
  let newColourRGBA = colourObjectToRGBA(currentColour);

  context.fillStyle = `rgba(${newColourRGBA})`;
  context.fillRect(
    Math.round(x * pixelSize.x),
    Math.round(y * pixelSize.y),
    Math.round(pixelSize.x),
    Math.round(pixelSize.y),
  );

  // Update Canvas Data
  const dataUrl = canvas.toDataURL();
  saveImageToSession(dataUrl);
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
) => {
  context.clearRect(
    Math.round(x * pixelSize.x),
    Math.round(y * pixelSize.y),
    Math.round(pixelSize.x),
    Math.round(pixelSize.y),
  );

  // Update Canvas Data
  const dataUrl = canvas.toDataURL();
  saveImageToSession(dataUrl);
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
) => {
  const initialColour = getColourAtPixel(
    x,
    y,
    "hex",
    pixelSize,
    context,
  ) as ColourObject;

  const getTime = Date.now();

  if (compareColourObjects(initialColour, currentColour)) return;

  const pixelStack: { x: number; y: number }[] = [{ x, y }];
  const checkedStack: Set<string> = new Set();

  const addCheckedPixel = (pixel: { x: number; y: number }) => {
    checkedStack.add(`${pixel.x},${pixel.y}`);
  };

  const isCheckedPixel = (pixel: { x: number; y: number }) => {
    return checkedStack.has(`${pixel.x},${pixel.y}`);
  };

  // Retrieve the ImageData object
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Function to set pixel color in ImageData
  const setPixelColor = (x: number, y: number, color: ColourObject) => {
    const index = (y * canvas.width + x) * 4;
    const { r, g, b } = hexToRgb(color.colour as string);

    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = color.alpha;
  };

  while (pixelStack.length > 0) {
    const currentPixel: { x: number; y: number } = pixelStack.pop()!;
    setPixelColor(currentPixel.x, currentPixel.y, currentColour);

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

  // Copy Off-Screen Canvas to Main Canvas
  context.putImageData(imageData, 0, 0);
  console.log(imageData.data);
  console.log(context.getImageData(0, 0, canvas.width, canvas.height).data);

  // Update Canvas Data
  const dataUrl = canvas.toDataURL();
  saveImageToSession(dataUrl);

  console.log(Date.now() - getTime, "ms");
};

export {
  getImageFromSession,
  saveImageToSession,
  getColourAtPixel,
  drawPixel,
  pickerPixel,
  erasePixel,
  fillPixel,
};
