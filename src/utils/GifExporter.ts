// utils/GifExporter.ts
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { Artwork } from "@/types/canvas";

export interface GifExportOptions {
  frameIndices?: number[]; // specific frames to export, defaults to all
  scale?: number; // scale multiplier, default 1
  onProgress?: (percent: number) => void;
}

/**
 * Composites all visible layers for a given frame into a single RGBA pixel array.
 */
const compositeFrame = (
  artwork: Artwork,
  frameIndex: number,
  width: number,
  height: number,
): Uint8ClampedArray => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = false;

  artwork.layers.forEach((layer) => {
    if (layer.visible && layer.frames[frameIndex]) {
      const imageData = layer.frames[frameIndex];
      if (imageData) {
        tempCtx.clearRect(0, 0, width, height);
        tempCtx.putImageData(imageData, 0, 0);
        ctx.globalAlpha = layer.opacity ?? 1;
        ctx.globalCompositeOperation = layer.blendMode || "source-over";
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  return ctx.getImageData(0, 0, width, height).data;
};

/**
 * Export artwork frames as an animated GIF.
 * Returns a Blob containing the GIF data.
 */
export const exportAsGif = async (
  artwork: Artwork,
  options: GifExportOptions = {},
): Promise<Blob> => {
  const { scale = 1, onProgress } = options;
  const frameIndices =
    options.frameIndices ??
    Array.from({ length: artwork.frames.length }, (_, i) => i);

  // Get dimensions from first layer's first frame
  const firstLayer = artwork.layers[0];
  const firstFrame = firstLayer?.frames[0];
  if (!firstFrame) throw new Error("Artwork has no frame data");

  const srcWidth = firstFrame.width;
  const srcHeight = firstFrame.height;
  const outWidth = srcWidth * scale;
  const outHeight = srcHeight * scale;

  const gif = GIFEncoder();

  // Scale canvas for upscaling if needed
  const scaleCanvas = document.createElement("canvas");
  scaleCanvas.width = outWidth;
  scaleCanvas.height = outHeight;
  const scaleCtx = scaleCanvas.getContext("2d")!;
  scaleCtx.imageSmoothingEnabled = false;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcWidth;
  srcCanvas.height = srcHeight;
  const srcCtx = srcCanvas.getContext("2d")!;

  for (let i = 0; i < frameIndices.length; i++) {
    const fi = frameIndices[i];
    const rgba = compositeFrame(artwork, fi, srcWidth, srcHeight);

    let finalRgba: Uint8ClampedArray;
    if (scale !== 1) {
      // Scale up using canvas
      const imgData = new ImageData(rgba, srcWidth, srcHeight);
      srcCtx.putImageData(imgData, 0, 0);
      scaleCtx.clearRect(0, 0, outWidth, outHeight);
      scaleCtx.drawImage(srcCanvas, 0, 0, outWidth, outHeight);
      finalRgba = scaleCtx.getImageData(0, 0, outWidth, outHeight).data;
    } else {
      finalRgba = rgba;
    }

    const palette = quantize(finalRgba, 256);
    const index = applyPalette(finalRgba, palette);
    const delay = artwork.frames[fi] ?? 100;

    gif.writeFrame(index, outWidth, outHeight, {
      palette,
      delay,
      transparent: true,
    });

    onProgress?.(Math.round(((i + 1) / frameIndices.length) * 100));
  }

  gif.finish();

  return new Blob([gif.bytes()], { type: "image/gif" });
};

/**
 * Export and download as GIF file.
 */
export const downloadGif = async (
  artwork: Artwork,
  filename: string,
  options: GifExportOptions = {},
): Promise<void> => {
  const blob = await exportAsGif(artwork, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.gif`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
