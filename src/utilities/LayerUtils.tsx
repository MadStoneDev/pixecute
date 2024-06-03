import { ArtworkObject, Layer } from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";

const ARTWORK_SESSION = "artworkObject";
const DUMP_SESSION = "sessionDump";

const imageDataToJSON = (imageData: ImageData): string => {
  const { width, height, data } = imageData;

  const imageDataJSON = { width, height, data };
  return JSON.stringify(imageDataJSON);
};

const jsonToImageData = (json: string): ImageData => {
  const parsed = JSON.parse(json);

  if (!parsed.data || typeof parsed.data !== "object") {
    console.error("Invalid Data in JSON");

    return new ImageData(1, 1);
  }

  // Convert Object to Array
  const dataArray: number[] = Object.values(parsed.data);

  if (dataArray.length === 0) {
    console.error("Empty Data Array in JSON");
    return new ImageData(1, 1);
  }

  const uint8Array = new Uint8ClampedArray(dataArray);

  if (uint8Array.length !== parsed.width * parsed.height * 4) {
    console.error(
      `Data array length ${uint8Array.length} does not match expected length ${
        parsed.width * parsed.height * 4
      }`,
    );
  }

  return new ImageData(uint8Array, parsed.width, parsed.height);
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

const serialiseArtworkObject = (artworkObject: ArtworkObject): string => {
  const serialisedLayers = artworkObject.layers.map((layer) => {
    const serialisedFrames = Object.entries(layer.frames).map(
      ([key, frame]) => {
        const frameKey = key as unknown as number;

        if (frame) {
          const dataURL = imageDataToDataURL(frame);
          return [frameKey, dataURL];
        }

        return [frameKey, null];
      },
    );

    return {
      ...layer,
      frames: Object.fromEntries(serialisedFrames),
    };
  });

  const artworkToSave = {
    ...artworkObject,
    layers: serialisedLayers,
  };

  return JSON.stringify(artworkToSave);
};

const hasImageDataChanged = (imageData1: ImageData, imageData2: ImageData) => {
  if (
    imageData1.width !== imageData2.width ||
    imageData1.height !== imageData2.height
  )
    return true;

  const imageData1Array = imageData1.data;
  const imageData2Array = imageData2.data;

  for (let i = 0; i < imageData1Array.length; i++) {
    if (imageData1Array[i] !== imageData2Array[i]) return true;
  }

  return false;
};

// Clear Artwork from Session Storage
const resetArtworkInSession = () => {
  sessionStorage.removeItem(ARTWORK_SESSION);
  sessionStorage.setItem(ARTWORK_SESSION, JSON.stringify(NewArtworkObject));
};

// Save Artwork to Session Storage
const saveArtworkToSession = (
  artworkObject: ArtworkObject,
  sessionKey: string,
) => {
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
  sessionStorage.setItem(sessionKey, JSON.stringify(artworkToSave));
};

// Load Artwork from Session Storage
const loadArtworkFromSession = (sessionKey: string): ArtworkObject => {
  const artworkData = JSON.parse(
    sessionStorage.getItem(sessionKey) || `{"layers": [], "frames": []}`,
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

// Clear History from Session Storage
const resetArtworkHistoryInSession = () => {
  sessionStorage.removeItem("history");
  sessionStorage.removeItem("historyPointer");
};

// Save History to Session Storage
const saveArtworkHistoryToSession = (
  artworkHistory: ArtworkObject[],
  sessionKey: string,
) => {
  const historyData = artworkHistory.map((artworkObject) => {
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

    return { layers: layersData, frames: artworkObject.frames };
  });

  sessionStorage.setItem(sessionKey, JSON.stringify(historyData));
};

// Load History from Session Storage
const loadArtworkHistoryFromSession = (sessionKey: string): ArtworkObject[] => {
  const serializedHistory = sessionStorage.getItem(sessionKey);
  if (!serializedHistory) return [];

  const historyData = JSON.parse(serializedHistory);

  return historyData.map((artworkObject: any) => {
    const layers = artworkObject.layers.map((layer: any) => ({
      ...layer,
      frames: Object.entries(layer.frames).reduce(
        (acc, [key, imageData]) => {
          acc[key] = imageData ? jsonToImageData(imageData as string) : null;
          return acc;
        },
        {} as { [key: string]: ImageData | null },
      ),
    }));

    return { layers, frames: artworkObject.frames };
  });
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
    locked: false,
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

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
  validateArtwork(updatedArtwork);
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
    const newFrameNumber = artworkObject.frames.length + 1;
    const emptyImageData = new ImageData(1, 1);

    return {
      ...layer,
      frames: { ...layer.frames, [newFrameNumber]: emptyImageData },
    };
  });

  const updatedArtwork = {
    layers: updatedLayers,
    frames: updatedFrames,
  };

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
  validateArtwork(updatedArtwork);
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

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
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

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
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

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
  validateArtwork(updatedArtwork);
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

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
  validateArtwork(updatedArtwork);
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

    for (let i = 1; i <= frameCount; i++) {
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
    layers: updatedLayers,
    frames: artworkObject.frames,
  };

  saveArtworkToSession(updatedArtwork, ARTWORK_SESSION);
  return updatedArtwork;
};

export {
  imageDataToJSON,
  jsonToImageData,
  imageDataToDataURL,
  dataURLToImageData,
  hasImageDataChanged,
  resetArtworkInSession,
  saveArtworkToSession,
  loadArtworkFromSession,
  resetArtworkHistoryInSession,
  saveArtworkHistoryToSession,
  loadArtworkHistoryFromSession,
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
