import { ArtworkObject, Layer } from "@/types/canvas";

const ARTWORK_SESSION = "artworkObject";
const DUMP_SESSION = "sessionDump";

const imageDataToJSON = (imageData: ImageData): string => {
  const { width, height, data } = imageData;

  const imageDataJSON = { width, height, data };
  return JSON.stringify(imageDataJSON);
};

const jsonToImageData = (json: string): ImageData => {
  const parsed = JSON.parse(json);

  return new ImageData(
    new Uint8ClampedArray(parsed.data),
    parsed.width,
    parsed.height,
  );
};

// Convert ImageData to Base64 DataURL
const imageDataToDataURL = (imageData: ImageData): string => {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d");
  context?.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
};

// Convert Base64 DataURL to ImageData
const dataURLToImageData = (dataURL: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = dataURL;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");
      context!.drawImage(image, 0, 0);

      resolve(context!.getImageData(0, 0, image.width, image.height));
    };

    image.onerror = (error) => {
      reject(error);
    };
  });
};

// Save Artwork to Session Storage
const saveArtworkToSession = (artworkObject: ArtworkObject) => {
  const layersData = artworkObject.layers.map((layer) => ({
    ...layer,
    frames: Object.entries(layer.frames).reduce(
      (acc, [key, imageData]) => {
        acc[key] = imageData ? imageDataToJSON(imageData) : null;
        return acc;
      },
      {} as { [key: string]: string | null },
    ),
  }));

  const artworkToSave = { layers: layersData, frames: artworkObject.frames };
  sessionStorage.setItem(ARTWORK_SESSION, JSON.stringify(artworkToSave));
};

// Load Artwork from Session Storage
const loadArtworkFromSession = (): ArtworkObject => {
  const artworkData = JSON.parse(
    sessionStorage.getItem(ARTWORK_SESSION) || `{"layers": [], "frames": []}`,
  );

  const layers = artworkData.layers.map((layerData: any) => {
    const frames = Object.entries(layerData.frames).reduce(
      (acc, [key, json]) => {
        acc[key] = json ? jsonToImageData(json as string) : null;
        return acc;
      },
      {} as { [key: string]: ImageData | null },
    );

    return {
      ...layerData,
      frames,
    };
  });

  return {
    layers,
    frames: artworkData.frames,
  };
};

// Generate ID for Layer
const generateLayerID = (name: string) => {
  const randomNumber = Math.floor(Math.random() * 10000);

  const layerIDJSON = JSON.stringify({
    name,
    randomNumber,
  });

  return btoa(layerIDJSON);
};

// Decode Layer ID
const decodeLayerID = (id: string): JSON => {
  const decodedString = atob(id);

  return JSON.parse(decodedString);
};

// New Layer
const addNewLayer = (artworkObject: {
  layers: Layer[];
  frames: number[];
}): ArtworkObject => {
  // const newLayerName = `Layer ${layers.length + 1}`;
  const layerName = `Layer ${artworkObject.layers.length + 1}`;

  const newLayer: Layer = {
    id: generateLayerID(layerName),
    name: layerName,
    opacity: 1,
    visible: true,
    frames: artworkObject.frames.reduce(
      (acc, _, index) => {
        acc[index] = null;
        return acc;
      },
      {} as { [key: number]: ImageData | null },
    ),
  };

  const updatedLayers = [...artworkObject.layers, newLayer];
  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };
  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// New Frame
const addNewFrame = (artworkObject: {
  layers: Layer[];
  frames: number[];
}): ArtworkObject => {
  const newFrameDuration =
    artworkObject.frames[artworkObject.frames.length - 1];
  const updatedFrames = [...artworkObject.frames, newFrameDuration];

  const updatedLayers = artworkObject.layers.map((layer) => {
    const frameKeys = Object.keys(frames).map(Number);
    const newFrameNumber = Math.max(...frameKeys) + 1;

    return {
      ...layer,
      frames: { ...layer.frames, [newFrameNumber]: null },
    };
  });

  const updatedArtwork = {
    layers: updatedLayers,
    frames: updatedFrames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// Re-Arrange Layers
// Move Layer Up
const moveLayerUp = (
  artworkObject: { layers: Layer[]; frames: number[] },
  layerID: number,
): ArtworkObject => {
  if (layerID <= 0) return artworkObject;

  const updatedLayers = [...artworkObject.layers];
  [updatedLayers[layerID], updatedLayers[layerID - 1]] = [
    updatedLayers[layerID - 1],
    updatedLayers[layerID],
  ];

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// Move Layer Down
const moveLayerDown = (
  artworkObject: { layers: Layer[]; frames: number[] },
  layerID: number,
): ArtworkObject => {
  if (layerID >= artworkObject.layers.length - 1) return artworkObject;

  const updatedLayers = [...artworkObject.layers];
  [updatedLayers[layerID], updatedLayers[layerID + 1]] = [
    updatedLayers[layerID + 1],
    updatedLayers[layerID],
  ];

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// Delete Layer
const deleteLayer = (
  artworkObject: { layers: Layer[]; frames: number[] },
  layerID: number,
): ArtworkObject => {
  if (artworkObject.layers.length <= 1) return artworkObject;

  const updatedLayers = artworkObject.layers.filter(
    (_, index) => index !== layerID,
  );

  const updatedArtwork = {
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// Delete Frame
const deleteFrame = (
  artworkObject: { layers: Layer[]; frames: number[] },
  frameID: number,
): ArtworkObject => {
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
    layers: artworkObject.layers,
    frames: updatedFrames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

// Validate Artwork
const validateArtwork = (artworkObject: {
  layers: Layer[];
  frames: number[];
}): ArtworkObject => {
  const frameCount = artworkObject.frames.length;
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

    for (let i = 0; i < frameCount; i++) {
      if (!updatedFrames[i]) {
        updatedFrames[i] = null;
      }
    }

    return {
      ...layer,
      frames: updatedFrames,
    };
  });

  const updatedArtwork = {
    layers: artworkObject.layers,
    frames: artworkObject.frames,
  };

  saveArtworkToSession(updatedArtwork);
  return updatedArtwork;
};

export {
  imageDataToJSON,
  jsonToImageData,
  imageDataToDataURL,
  dataURLToImageData,
  saveArtworkToSession,
  loadArtworkFromSession,
  generateLayerID,
  decodeLayerID,
  addNewLayer,
  addNewFrame,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  deleteFrame,
  validateArtwork,
};
