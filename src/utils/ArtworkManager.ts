// utils/ArtworkManager.ts
import { db } from "@/utils/DexieDB";
import { Artwork } from "@/types/canvas";
import { serializeArtwork } from "@/utils/Serialization";

export interface ArtworkInfo {
  id?: number;
  keyIdentifier: string;
  name: string;
  dimensions: { width: number; height: number };
  frameCount: number;
  layerCount: number;
  thumbnail: string;
  lastModified: Date;
  fileSize: string;
}

export const getAllArtworks = async (): Promise<ArtworkInfo[]> => {
  try {
    const artworks = await db.artworks.orderBy("id").reverse().toArray();

    return artworks
      .filter((artwork) => artwork.keyIdentifier)
      .map((artwork) => ({
        id: artwork.id!,
        keyIdentifier: artwork.keyIdentifier!,
        name: extractArtworkName(artwork),
        dimensions: extractDimensions(artwork),
        frameCount: artwork.frames.length,
        layerCount: artwork.layers.length,
        thumbnail: generateArtworkThumbnail(artwork),
        lastModified: new Date(),
        fileSize: estimateFileSize(artwork),
      }));
  } catch (error) {
    console.error("Failed to fetch artworks:", error);
    return [];
  }
};

export const deleteArtwork = async (
  keyIdentifier: string,
): Promise<boolean> => {
  try {
    const artwork = await db.artworks
      .where("keyIdentifier")
      .equals(keyIdentifier)
      .first();

    if (artwork && artwork.id) {
      await db.artworks.delete(artwork.id);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to delete artwork:", error);
    return false;
  }
};

export const exportArtworkAsJSON = (
  artwork: Artwork,
  filename?: string,
): void => {
  const artworkName = filename || extractArtworkName(artwork);
  // Use custom serializer for ImageData
  const serialized = serializeArtwork(artwork);
  const jsonString = JSON.stringify(serialized, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${artworkName}.pixecute`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const exportArtworkAsPNG = (
  artwork: Artwork,
  frameIndex: number = 0,
  scale: number = 1,
  filename?: string,
): void => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const dimensions = extractDimensions(artwork);
  canvas.width = dimensions.width * scale;
  canvas.height = dimensions.height * scale;

  ctx.imageSmoothingEnabled = false;

  // Create temporary canvas at original size for proper compositing
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return;

  tempCanvas.width = dimensions.width;
  tempCanvas.height = dimensions.height;
  tempCtx.imageSmoothingEnabled = false;

  // Compositing canvas
  const compCanvas = document.createElement("canvas");
  const compCtx = compCanvas.getContext("2d");
  if (!compCtx) return;
  compCanvas.width = dimensions.width;
  compCanvas.height = dimensions.height;
  compCtx.imageSmoothingEnabled = false;

  // Render visible layers (0-indexed frames)
  artwork.layers.forEach((layer) => {
    if (layer.visible && layer.frames[frameIndex]) {
      const imageData = layer.frames[frameIndex];
      if (imageData) {
        // Clear temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.putImageData(imageData, 0, 0);

        // Use drawImage for proper globalAlpha/compositeOperation support
        compCtx.globalAlpha = layer.opacity || 1;
        compCtx.globalCompositeOperation = layer.blendMode || "source-over";
        compCtx.drawImage(tempCanvas, 0, 0);
      }
    }
  });

  compCtx.globalAlpha = 1;
  compCtx.globalCompositeOperation = "source-over";

  // Scale up to final canvas
  ctx.drawImage(
    compCanvas,
    0,
    0,
    dimensions.width,
    dimensions.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // Download
  const artworkName = filename || extractArtworkName(artwork);
  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artworkName}_${scale}x.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
};

const extractArtworkName = (artwork: Artwork): string => {
  if (!artwork.keyIdentifier) {
    return "Unknown_Artwork";
  }
  return `Artwork_${artwork.keyIdentifier.slice(0, 8)}`;
};

const extractDimensions = (
  artwork: Artwork,
): { width: number; height: number } => {
  // Try to get dimensions from first layer's first frame (0-indexed)
  const firstLayer = artwork.layers[0];
  if (firstLayer && firstLayer.frames[0]) {
    const imageData = firstLayer.frames[0];
    return { width: imageData.width, height: imageData.height };
  }

  return { width: 16, height: 16 };
};

const generateArtworkThumbnail = (artwork: Artwork): string => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return "";

    const dimensions = extractDimensions(artwork);

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return "";
    tempCtx.imageSmoothingEnabled = false;

    // Render visible layers for frame 0
    artwork.layers.forEach((layer) => {
      if (layer.visible && layer.frames[0]) {
        const imageData = layer.frames[0];

        if (imageData) {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.putImageData(imageData, 0, 0);

          ctx.globalAlpha = layer.opacity || 1;
          ctx.globalCompositeOperation = layer.blendMode || "source-over";
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const thumbnailCanvas = document.createElement("canvas");
    const thumbnailCtx = thumbnailCanvas.getContext("2d");

    if (!thumbnailCtx) return "";

    const maxSize = 64;
    const scale = Math.min(
      maxSize / dimensions.width,
      maxSize / dimensions.height,
    );
    const thumbnailWidth = Math.floor(dimensions.width * scale);
    const thumbnailHeight = Math.floor(dimensions.height * scale);

    thumbnailCanvas.width = thumbnailWidth;
    thumbnailCanvas.height = thumbnailHeight;
    thumbnailCtx.imageSmoothingEnabled = false;

    thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);

    return thumbnailCanvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    return "";
  }
};

const estimateFileSize = (artwork: Artwork): string => {
  let totalPixels = 0;
  const dimensions = extractDimensions(artwork);

  artwork.layers.forEach((layer) => {
    layer.frames.forEach((frame) => {
      if (frame) {
        totalPixels += dimensions.width * dimensions.height;
      }
    });
  });

  const estimatedBytes = totalPixels * 4;
  const estimatedKB = Math.round(estimatedBytes / 1024);

  if (estimatedKB < 1024) {
    return `${estimatedKB} KB`;
  }

  return `${Math.round(estimatedKB / 1024)} MB`;
};
