// Convert ImageData to Base64 DataURL
import { Layer } from "@/types/canvas";

export const imageDataToDataURL = (imageData: ImageData): string => {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d");
  context?.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
};

// Convert Base64 DataURL to ImageData
export const dataURLToImageData = (dataURL: string): Promise<ImageData> => {
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

// Save Layers from Session Storage
export const saveLayersToSession = (layers: Layer[]) => {
  const layersData = layers.map((layer) => {
    return {
      ...layer,
      frames: Object.entries(layer.frames).reduce(
        (acc, [key, imageData]) => {
          acc[key] = imageData ? imageDataToDataURL(imageData) : null;
          return acc;
        },
        {} as { [key: string]: string | null },
      ),
    };
  });

  sessionStorage.setItem("layers", JSON.stringify(layersData));
};

// Load Layers from Session Storage
export const loadLayersFromSession = async (): Promise<Layer[]> => {
  const layersData = JSON.parse(sessionStorage.getItem("layers") || "[]");

  return Promise.all(
    layersData.map(async (layerData: any) => {
      const frames = await Promise.all(
        Object.entries(layerData.frames).map(async ([key, dataURL]) => {
          const imageData = dataURL
            ? await dataURLToImageData(dataURL as string)
            : null;
          return [key, imageData];
        }),
      );

      return {
        ...layerData,
        frames: Object.fromEntries(frames) as {
          [key: string]: ImageData | null;
        },
      };
    }),
  );
};
