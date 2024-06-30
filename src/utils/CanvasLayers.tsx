import { Artwork, Layer } from "@/types/canvas";
import { saveArtwork } from "@/utils/IndexedDB";

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

export const addNewLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  const framesCount = artwork.frames.length;

  artwork.layers.splice(selectedLayer + 1, 0, {
    name: `Layer ${artwork.layers.length + 1}`,
    frames: {},
    opacity: 1,
    visible: true,
    locked: false,
  });

  for (let i = 0; i < framesCount; i++) {
    artwork.layers[selectedLayer + 1].frames[i + 1] = new ImageData(1, 1);
  }
};

export const deleteLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  artwork.layers.splice(selectedLayer, 1);
};

const renameLayerCopy = (layerName: string) => {
  const match = layerName.match(/^\(c([0-9]+)\) /);

  if (match) {
    const originalName = layerName.slice(match.join().length);
    const newNumber = parseInt(match[1], 10) + 1;
    return `(c${newNumber}) ${originalName}`;
  } else {
    return `(c1) ${layerName}`;
  }
};

export const duplicateLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  const newLayer = artwork.layers[selectedLayer];
  newLayer.name = renameLayerCopy(newLayer.name);

  artwork.layers.splice(selectedLayer + 1, 0, newLayer);
};

export const moveLayerUp = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  if (selectedLayer === 0) return;
  [artwork.layers[selectedLayer - 1], artwork.layers[selectedLayer]] = [
    artwork.layers[selectedLayer],
    artwork.layers[selectedLayer - 1],
  ];
};

export const moveLayerDown = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  if (selectedLayer === artwork.layers.length - 1) return;
  [artwork.layers[selectedLayer], artwork.layers[selectedLayer + 1]] = [
    artwork.layers[selectedLayer + 1],
    artwork.layers[selectedLayer],
  ];
};

export const lockLayer = async ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  artwork.layers[selectedLayer].locked = true;
};

export const unlockLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  artwork.layers[selectedLayer].locked = false;
};

export const hideLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  artwork.layers[selectedLayer].visible = false;
};

export const showLayer = ({
  artwork,
  selectedLayer,
}: {
  artwork: Artwork;
  selectedLayer: number;
}) => {
  artwork.layers[selectedLayer].visible = true;
};

export const changeLayerName = ({
  artwork,
  selectedLayer,
  newName,
}: {
  artwork: Artwork;
  selectedLayer: number;
  newName: string;
}) => {
  artwork.layers[selectedLayer].name = newName;
};

export const changeLayerOpacity = ({
  artwork,
  selectedLayer,
  newOpacity,
}: {
  artwork: Artwork;
  selectedLayer: number;
  newOpacity: number;
}) => {
  artwork.layers[selectedLayer].opacity = newOpacity;
};
