// utils/ImageImport.ts
import { Artwork, Layer } from "@/types/canvas";
import { generateKeyIdentifier, saveArtwork } from "@/utils/IndexedDB";
import { generateLayerId } from "@/utils/NewArtwork";
import { deserializeArtwork } from "@/utils/Serialization";

export interface ImportResult {
  success: boolean;
  artwork?: Artwork;
  error?: string;
}

export const supportedImageTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

export const supportedFileTypes = [
  ...supportedImageTypes,
  "application/json", // For Pixecute files
];

export const imageFileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    if (!supportedImageTypes.includes(file.type)) {
      reject(new Error(`Unsupported image type: ${file.type}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const createArtworkFromImageData = async (
  imageData: ImageData,
  filename: string,
): Promise<Artwork> => {
  const keyIdentifier = await generateKeyIdentifier();

  const baseLayer: Layer = {
    id: generateLayerId(),
    name: "Imported Image",
    opacity: 1,
    visible: true,
    locked: false,
    frames: [imageData], // 0-indexed
  };

  const artwork: Artwork = {
    keyIdentifier,
    layers: [baseLayer],
    frames: [100],
  };

  return artwork;
};

export const importFile = async (file: File): Promise<ImportResult> => {
  try {
    if (file.type === "application/json") {
      return await importPixecuteFile(file);
    }

    if (supportedImageTypes.includes(file.type)) {
      const imageData = await imageFileToImageData(file);
      const artwork = await createArtworkFromImageData(imageData, file.name);

      await saveArtwork(artwork);

      return {
        success: true,
        artwork,
      };
    }

    return {
      success: false,
      error: `Unsupported file type: ${file.type}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

const importPixecuteFile = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        if (!isValidPixecuteFile(jsonData)) {
          resolve({
            success: false,
            error: "Invalid Pixecute file format",
          });
          return;
        }

        const keyIdentifier = await generateKeyIdentifier();
        // Deserialize ImageData from base64
        const deserialized = deserializeArtwork(jsonData);
        const artwork: Artwork = {
          ...deserialized,
          keyIdentifier,
        };

        // Ensure all layers have IDs
        artwork.layers = artwork.layers.map((layer: any) => ({
          ...layer,
          id: layer.id || generateLayerId(),
        }));

        await saveArtwork(artwork);

        resolve({
          success: true,
          artwork,
        });
      } catch (error) {
        resolve({
          success: false,
          error: "Failed to parse JSON file",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: "Failed to read file",
      });
    };

    reader.readAsText(file);
  });
};

const isValidPixecuteFile = (data: any): data is Artwork => {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.layers) &&
    Array.isArray(data.frames) &&
    data.layers.every(
      (layer: any) =>
        layer.name &&
        typeof layer.visible === "boolean" &&
        typeof layer.locked === "boolean" &&
        (Array.isArray(layer.frames) || typeof layer.frames === "object"),
    )
  );
};

export const generateThumbnail = (
  imageData: ImageData,
  maxSize: number = 64,
): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const { width, height } = imageData;
  const scale = Math.min(maxSize / width, maxSize / height);
  const thumbnailWidth = Math.floor(width * scale);
  const thumbnailHeight = Math.floor(height * scale);

  canvas.width = thumbnailWidth;
  canvas.height = thumbnailHeight;

  ctx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return "";

  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(tempCanvas, 0, 0, thumbnailWidth, thumbnailHeight);

  return canvas.toDataURL("image/png");
};
