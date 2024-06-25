import { Artwork, ArtworkObject, CanvasConfig, Layer } from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";
import { saveArtwork } from "@/utilities/IndexedUtils";

const imageDataToJSON = ({ width, height, data }: ImageData): string =>
  JSON.stringify({ width, height, data });

const jsonToImageData = (json: string): ImageData => {
  const { width, height, data } = JSON.parse(json);

  if (!data || !Array.isArray(data)) {
    console.error("Invalid Data in JSON");
    return new ImageData(1, 1);
  }

  const uint8Array: Uint8ClampedArray = new Uint8ClampedArray(data);

  if (uint8Array.length !== width * height * 4) {
    console.error(
      `Data array length ${uint8Array.length} does not match expected length ${
        width * height * 4
      }`,
    );
    return new ImageData(1, 1);
  }

  return new ImageData(uint8Array, width, height);
};

const hasImageDataChanged = (imageData1: ImageData, imageData2: ImageData) => {
  if (
    imageData1.width !== imageData2.width ||
    imageData1.height !== imageData2.height
  )
    return true;

  return !imageData1.data.every(
    (value, index) => value === imageData2.data[index],
  );
};

// Lock/Unlock Layer
const toggleLayerLock = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layer: number,
  locked: boolean,
): Promise<ArtworkObject> => {
  artworkObject.layers[layer].locked = locked;

  const newArtwork: Artwork = { ...artworkObject, keyIdentifier };

  await saveArtwork(newArtwork);
  return artworkObject;
};

const lockLayer = (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layer: number,
) => toggleLayerLock(artworkObject, keyIdentifier, layer, true);
const unlockLayer = (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layer: number,
) => toggleLayerLock(artworkObject, keyIdentifier, layer, false);

// Generate ID for Layer
const generateLayerID = (name: string) =>
  btoa(
    JSON.stringify({
      name,
      randomNumber: Math.floor(Math.random() * 10000),
    }),
  );

// Decode Layer ID
const decodeLayerID = (id: string): JSON => JSON.parse(atob(id));

// New Layer
const addNewLayer = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
): Promise<ArtworkObject> => {
  const layerName = `Layer ${artworkObject.layers.length + 1}`;

  const newLayer: Layer = {
    id: generateLayerID(layerName),
    name: layerName,
    opacity: 1,
    visible: true,
    locked: false,
    frames: Object.fromEntries(
      artworkObject.frames.map((_, index) => [index + 1, new ImageData(1, 1)]),
    ),
  };

  const updatedArtwork = {
    layers: [...artworkObject.layers, newLayer],
    frames: artworkObject.frames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  await validateArtwork(updatedArtwork, keyIdentifier);
  return updatedArtwork;
};

// New Frame
const addNewFrame = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
): Promise<ArtworkObject> => {
  const newFrameDuration =
    artworkObject.frames[artworkObject.frames.length - 1];
  const updatedFrames = [...artworkObject.frames, newFrameDuration];

  const updatedLayers = artworkObject.layers.map((layer) => ({
    ...layer,
    frames: {
      ...layer.frames,
      [artworkObject.frames.length + 1]: new ImageData(1, 1),
    },
  }));

  const updatedArtwork = {
    layers: updatedLayers,
    frames: updatedFrames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  await validateArtwork(updatedArtwork, keyIdentifier);
  return updatedArtwork;
};

// Validate Layer
const validateSingleLayer = (
  canvas: HTMLCanvasElement,
  config: CanvasConfig,
  scaledPixel: number,
) => {
  if (!canvas) return;

  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.width = `${scaledPixel * config.width}px`;
  canvas.style.height = `${scaledPixel * config.height}px`;

  // Redraw Image
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context) context.imageSmoothingEnabled = false;
};

// Find out how many frames are in the artwork
const howManyFrames = (artworkObject: ArtworkObject) => {
  const framesByLayer = artworkObject.layers.reduce(
    (max, layer) => Math.max(max, Object.keys(layer.frames).length),
    0,
  );
  return Math.max(artworkObject.frames.length, framesByLayer);
};

// Validate Frames
const validateFrames = (artworkObject: ArtworkObject) => {
  // Get the number of frames in the artwork
  const frameCount = howManyFrames(artworkObject);

  // Loop through each layer and validate the frames
  artworkObject.layers.forEach((layer) => {
    for (let i = 1; i <= frameCount; i++) {
      if (!layer.frames[i]) layer.frames[i] = new ImageData(1, 1);
    }
  });

  const defaultTiming =
    artworkObject.frames.length === 0 ? artworkObject.frames[0] : 100;

  // Add Timings to Frames
  for (
    let currentFrame = artworkObject.frames.length;
    currentFrame < frameCount;
    currentFrame++
  ) {
    artworkObject.frames[currentFrame] = defaultTiming;
  }
};

// Re-Arrange Layers
const moveLayer = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layerID: number,
  direction: number,
): Promise<ArtworkObject> => {
  const targetID = layerID + direction;
  if (targetID < 0 || targetID >= artworkObject.layers.length)
    return artworkObject;

  const updatedLayers = [...artworkObject.layers];
  [updatedLayers[layerID], updatedLayers[targetID]] = [
    updatedLayers[targetID],
    updatedLayers[layerID],
  ];

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  return updatedArtwork;
};

const moveLayerUp = (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layerID: number,
) => moveLayer(artworkObject, keyIdentifier, layerID, -1);
const moveLayerDown = (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layerID: number,
) => moveLayer(artworkObject, keyIdentifier, layerID, 1);

// Delete Layer
const deleteLayer = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  layerID: number,
): Promise<ArtworkObject> => {
  if (artworkObject.layers.length <= 1) return artworkObject;

  const updatedLayers = artworkObject.layers.filter(
    (_, index) => index !== layerID,
  );

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  await validateArtwork(updatedArtwork, keyIdentifier);
  return updatedArtwork;
};

// Delete Frame
const deleteFrame = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
  frameID: number,
): Promise<ArtworkObject> => {
  const updatedFrames = artworkObject.frames.filter(
    (_, index) => index !== frameID,
  );

  const updatedLayers = artworkObject.layers.map((layer) => {
    const updatedFrames = { ...layer.frames };
    delete updatedFrames[frameID + 1];

    return {
      ...layer,
      frames: updatedFrames,
    };
  });

  const updatedArtwork = {
    layers: updatedLayers,
    frames: updatedFrames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  await validateArtwork(updatedArtwork, keyIdentifier);
  return updatedArtwork;
};

// Validate Artwork
const validateArtwork = async (
  artworkObject: ArtworkObject,
  keyIdentifier: string,
): Promise<ArtworkObject> => {
  const frameCount = howManyFrames(artworkObject);

  const updatedLayers = artworkObject.layers.map((layer) => {
    const updatedFrames = Object.keys(layer.frames)
      .map(Number)
      .filter((frameNumber) => frameNumber <= frameCount)
      .reduce(
        (acc, frameNumber) => {
          acc[frameNumber] = layer.frames[frameNumber];
          return acc;
        },
        {} as { [key: number]: ImageData | null },
      );

    for (let i = 1; i <= frameCount; i++) {
      if (!updatedFrames[i]) {
        updatedFrames[i] = new ImageData(1, 1);
      }
    }

    return {
      ...layer,
      frames: updatedFrames,
    };
  });

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  const newArtwork: Artwork = { ...updatedArtwork, keyIdentifier };

  await saveArtwork(newArtwork);
  return updatedArtwork;
};

export {
  imageDataToJSON,
  jsonToImageData,
  hasImageDataChanged,
  lockLayer,
  unlockLayer,
  generateLayerID,
  decodeLayerID,
  addNewLayer,
  addNewFrame,
  validateSingleLayer,
  howManyFrames,
  validateFrames,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  deleteFrame,
  validateArtwork,
};
