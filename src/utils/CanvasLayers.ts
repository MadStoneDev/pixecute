import { Artwork, Layer } from "@/types/canvas";
import { generateLayerId } from "@/utils/NewArtwork";

export const regenerateCanvasLayers = (
  artworkLayers: Layer[],
  selectedFrame: number = 0,
  canvasSize: { width: number; height: number } = {
    width: 16,
    height: 16,
  },
): HTMLCanvasElement[] => {
  const canvasLayers: HTMLCanvasElement[] = [];

  for (const layer of artworkLayers) {
    if (!layer.visible) continue;
    const frame = layer.frames[selectedFrame];
    if (!frame) continue;

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
    // Optimized checkerboard: use ImageData buffer directly
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    const lightR = 0xa3,
      lightG = 0xa3,
      lightB = 0xa3;
    const darkR = 0x52,
      darkG = 0x52,
      darkB = 0x52;

    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const idx = (row * w + col) * 4;
        const isLight = (row % 2 === 0) === (col % 2 === 0);
        data[idx] = isLight ? lightR : darkR;
        data[idx + 1] = isLight ? lightG : darkG;
        data[idx + 2] = isLight ? lightB : darkB;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.imageSmoothingEnabled = false;
};

// All layer operations are pure: they return new artwork, not mutate
export const addNewLayer = (
  artwork: Artwork,
  selectedLayer: number,
): Artwork => {
  const framesCount = artwork.frames.length;
  const newLayer: Layer = {
    id: generateLayerId(),
    name: `Layer ${artwork.layers.length + 1}`,
    frames: [],
    opacity: 1,
    visible: true,
    locked: false,
  };

  for (let i = 0; i < framesCount; i++) {
    newLayer.frames.push(null);
  }

  const newLayers = [...artwork.layers];
  newLayers.splice(selectedLayer + 1, 0, newLayer);

  return { ...artwork, layers: newLayers };
};

export const deleteLayer = (
  artwork: Artwork,
  selectedLayer: number,
): Artwork => {
  const newLayers = [...artwork.layers];
  newLayers.splice(selectedLayer, 1);
  return { ...artwork, layers: newLayers };
};

const renameLayerCopy = (layerName: string) => {
  const match = layerName.match(/^\(c\) /);
  if (match) {
    return layerName;
  } else {
    return `(c) ${layerName}`;
  }
};

export const duplicateLayer = (
  artwork: Artwork,
  selectedLayer: number,
): Artwork => {
  const source = artwork.layers[selectedLayer];
  // Deep-copy frames including ImageData
  const newFrames: (ImageData | null)[] = source.frames.map((frame) => {
    if (!frame) return null;
    return new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height,
    );
  });

  const newLayer: Layer = {
    ...source,
    id: generateLayerId(),
    name: renameLayerCopy(source.name),
    frames: newFrames,
  };

  const newLayers = [...artwork.layers];
  newLayers.splice(selectedLayer + 1, 0, newLayer);

  return { ...artwork, layers: newLayers };
};

export const moveLayerUp = (
  artwork: Artwork,
  selectedLayer: number,
): Artwork => {
  if (selectedLayer === 0) return artwork;
  const newLayers = [...artwork.layers];
  [newLayers[selectedLayer - 1], newLayers[selectedLayer]] = [
    newLayers[selectedLayer],
    newLayers[selectedLayer - 1],
  ];
  return { ...artwork, layers: newLayers };
};

export const moveLayerDown = (
  artwork: Artwork,
  selectedLayer: number,
): Artwork => {
  if (selectedLayer === artwork.layers.length - 1) return artwork;
  const newLayers = [...artwork.layers];
  [newLayers[selectedLayer], newLayers[selectedLayer + 1]] = [
    newLayers[selectedLayer + 1],
    newLayers[selectedLayer],
  ];
  return { ...artwork, layers: newLayers };
};

export const toggleLockLayer = (
  artwork: Artwork,
  layerIndex: number,
): Artwork => {
  const newLayers = artwork.layers.map((l, i) =>
    i === layerIndex ? { ...l, locked: !l.locked } : l,
  );
  return { ...artwork, layers: newLayers };
};

export const toggleHideLayer = (
  artwork: Artwork,
  layerIndex: number,
): Artwork => {
  const newLayers = artwork.layers.map((l, i) =>
    i === layerIndex ? { ...l, visible: !l.visible } : l,
  );
  return { ...artwork, layers: newLayers };
};

export const changeLayerName = (
  artwork: Artwork,
  layerIndex: number,
  newName: string,
): Artwork => {
  const newLayers = artwork.layers.map((l, i) =>
    i === layerIndex ? { ...l, name: newName } : l,
  );
  return { ...artwork, layers: newLayers };
};

export const changeLayerOpacity = (
  artwork: Artwork,
  layerIndex: number,
  newOpacity: number,
): Artwork => {
  const newLayers = artwork.layers.map((l, i) =>
    i === layerIndex ? { ...l, opacity: newOpacity } : l,
  );
  return { ...artwork, layers: newLayers };
};
