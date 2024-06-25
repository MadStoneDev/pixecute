import omggif from "omggif";
import GIF from "gif.js";

import { ArtworkObject, CanvasConfig, Layer } from "@/types/canvas";

// save to gif
const saveToGif = (artworkObject: ArtworkObject, config: CanvasConfig) => {
  return new Promise(async (resolve, reject) => {
    const gif = new GIF();
    gif.on("finished", resolve);

    // Get merged layer object with all frames
  });
};

// load from gif
const loadFromGif = (blob: Blob) => {
  return new Promise(async (resolve, reject) => {
    const ab = await blob.arrayBuffer();

    const gifReader = new omggif.GifReader(new Uint8ClampedArray(ab));
    const frameCount = gifReader.numFrames();
    const frames: Array<HTMLCanvasElement> = [];

    for (let i = 0; i < frameCount; i++) {
      const currentFrame = gifReader.frameInfo(i);
      const image = new ImageData(currentFrame.width, currentFrame.height);
      gifReader.decodeAndBlitFrameRGBA(i, image.data);
      const canvas = document.createElement("canvas");
      canvas.width = currentFrame.width;
      canvas.height = currentFrame.height;

      const context = canvas.getContext("2d");
      if (!context) return false;

      context.putImageData(image, 0, 0);
      frames.push(canvas);
    }
    resolve(frames);
  });
};

// save to png

// load from png

// save to sprite sheet
const saveToSpriteSheet = (
  artworkObject: ArtworkObject,
  config: CanvasConfig,
) => {
  const saveWidth = config.width * artworkObject.frames.length;
  const saveHeight = config.height;

  const canvas = document.createElement("canvas");
  canvas.width = saveWidth;
  canvas.height = saveHeight;

  const context = canvas.getContext("2d");
  if (!context) return false;

  context.imageSmoothingEnabled = false;

  //
};

// Merge All Layers
const compressLayers = (artworkObject: ArtworkObject, config: CanvasConfig) => {
  const mergedLayer = document.createElement("canvas");
  mergedLayer.width = config.width;
  mergedLayer.height = config.height;

  const mergedContext = mergedLayer.getContext("2d");
  if (!mergedContext) return false;

  mergedContext.imageSmoothingEnabled = false;

  for (let count = artworkObject.frames.length; count > 0; count--) {}
};

// Merge Two Layers
const mergeLayers = (primaryLayer: Layer, secondaryLayer: Layer) => {
  const mergedFrames: { [key: number]: ImageData } = {};

  for (let frameIndex in primaryLayer.frames) {
    if (secondaryLayer.frames[frameIndex]) {
      mergedFrames[frameIndex] = new ImageData(0, 0);
      mergedFrames[frameIndex] = mergeTwoFrames(
        primaryLayer.frames[frameIndex]!,
        secondaryLayer.frames[frameIndex]!,
      );
    }
  }
};

// Merge Two Frames
const mergeTwoFrames = (
  primaryFrame: ImageData,
  secondaryFrame: ImageData,
): ImageData => {
  const mergedCanvas = document.createElement("canvas");
  mergedCanvas.width = primaryFrame.width;
  mergedCanvas.height = primaryFrame.height;

  const mergedContext = mergedCanvas.getContext("2d");
  if (!mergedContext) return new ImageData(0, 0);

  mergedContext.imageSmoothingEnabled = false;

  mergedContext.putImageData(primaryFrame, 0, 0);
  const mergedData = mergedContext.getImageData(
    0,
    0,
    mergedCanvas.width,
    mergedCanvas.height,
  );

  for (let count = 0; count < mergedData.data.length; count += 4) {
    if (mergedData.data[count + 3] === 0) {
      mergedData.data[count] = secondaryFrame.data[count];
      mergedData.data[count + 1] = secondaryFrame.data[count + 1];
      mergedData.data[count + 2] = secondaryFrame.data[count + 2];
      mergedData.data[count + 3] = secondaryFrame.data[count + 3];
    }
  }

  return mergedData;
};
