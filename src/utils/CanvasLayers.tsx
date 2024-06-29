import { Layer } from "@/types/canvas";
import React from "react";

export const regenerateCanvasLayers = (
  artworkLayers: Layer[],
  selectedFrame: number = 1,
  canvasSize: { width: number; height: number } = {
    width: 16,
    height: 16,
  },
): HTMLCanvasElement[] => {
  const getFrames: ImageData[] = artworkLayers
    .filter(
      (layer) => layer.visible && layer.frames[selectedFrame + 1] !== null,
    )
    .map((layer) => layer.frames[selectedFrame + 1] as ImageData);

  const canvasLayers: HTMLCanvasElement[] = [];

  for (const frame of getFrames) {
    if (frame !== null) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "10";
      canvas.style.imageRendering = "pixelated";

      if (ctx) {
        ctx.putImageData(frame, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }

      canvasLayers.push(canvas);
    }
  }

  return canvasLayers;
};

export const colourBackground = (
  background: string = "",
  canvas: HTMLCanvasElement,
) => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background === "transparent" || background === "") {
    for (let col = 0; col < canvas.width; col++) {
      for (let row = 0; row < canvas.height; row++) {
        ctx.fillStyle =
          (row % 2 === 0) === (col % 2 === 0) ? "#a3a3a3" : "#525252";
        ctx.fillRect(col, row, 1, 1);
      }
    }
  } else {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.imageSmoothingEnabled = false;
};

export const generateArtworkFromLayers = (layers: HTMLCanvasElement[]) => {
  for (const layer of layers) {
    const layerData = layer
      .getContext("2d")!
      .getImageData(0, 0, layer.width, layer.height);
    console.log(layerData);
  }
};
