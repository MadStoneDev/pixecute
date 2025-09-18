// utils/ArtworkManager.ts
import { db } from "@/utils/DexieDB";
import { Artwork } from "@/types/canvas";

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

/**
 * Get all artworks from IndexedDB with metadata
 */
export const getAllArtworks = async (): Promise<ArtworkInfo[]> => {
  try {
    const artworks = await db.artworks.orderBy("id").reverse().toArray();

    return artworks
      .filter((artwork) => artwork.keyIdentifier) // Filter out any invalid artworks
      .map((artwork) => ({
        id: artwork.id!,
        keyIdentifier: artwork.keyIdentifier!,
        name: extractArtworkName(artwork),
        dimensions: extractDimensions(artwork),
        frameCount: artwork.frames.length,
        layerCount: artwork.layers.length,
        thumbnail: generateArtworkThumbnail(artwork),
        lastModified: new Date(), // Could be enhanced with actual timestamps
        fileSize: estimateFileSize(artwork),
      }));
  } catch (error) {
    console.error("Failed to fetch artworks:", error);
    return [];
  }
};

/**
 * Delete an artwork by keyIdentifier
 */
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

/**
 * Export artwork as JSON file
 */
export const exportArtworkAsJSON = (
  artwork: Artwork,
  filename?: string,
): void => {
  const artworkName = filename || extractArtworkName(artwork);
  const jsonString = JSON.stringify(artwork, null, 2);
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

/**
 * Export artwork as PNG
 */
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

  // Create temporary canvas at original size
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) return;

  tempCanvas.width = dimensions.width;
  tempCanvas.height = dimensions.height;
  tempCtx.imageSmoothingEnabled = false;

  // Render visible layers for the specified frame
  artwork.layers.forEach((layer) => {
    if (layer.visible && layer.frames[frameIndex + 1]) {
      const imageData = layer.frames[frameIndex + 1];
      if (imageData) {
        tempCtx.globalAlpha = (layer.opacity || 100) / 100;
        tempCtx.globalCompositeOperation = layer.blendMode || "source-over";
        tempCtx.putImageData(imageData, 0, 0);
      }
    }
  });

  // Scale up to final canvas
  ctx.drawImage(
    tempCanvas,
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

/**
 * Extract artwork name from layers or generate one
 */
const extractArtworkName = (artwork: Artwork): string => {
  // Could be enhanced to store actual names in the artwork object
  if (!artwork.keyIdentifier) {
    return "Unknown_Artwork";
  }
  return `Artwork_${artwork.keyIdentifier.slice(0, 8)}`;
};

/**
 * Extract canvas dimensions from artwork
 */
const extractDimensions = (
  artwork: Artwork,
): { width: number; height: number } => {
  // Try to get dimensions from first layer's first frame
  const firstLayer = artwork.layers[0];
  if (firstLayer && firstLayer.frames[1]) {
    const imageData = firstLayer.frames[1];
    return { width: imageData.width, height: imageData.height };
  }

  // Default fallback
  return { width: 16, height: 16 };
};

/**
 * Generate thumbnail for artwork display
 */
const generateArtworkThumbnail = (artwork: Artwork): string => {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return "";

    const dimensions = extractDimensions(artwork);

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Configure rendering (EXACTLY like LiveDrawingArea)
    ctx.imageSmoothingEnabled = false;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a temporary canvas for each layer to properly composite (EXACTLY like LiveDrawingArea)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return "";
    tempCtx.imageSmoothingEnabled = false;

    // Render visible layers for frame 1 (EXACTLY like LiveDrawingArea logic)
    artwork.layers.forEach((layer, index) => {
      if (layer.visible && layer.frames[1]) {
        const imageData = layer.frames[1];

        if (imageData) {
          // Clear temp canvas
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          // Put the layer data on temp canvas
          tempCtx.putImageData(imageData, 0, 0);

          // Set layer properties and composite onto main canvas (EXACTLY like LiveDrawingArea)
          ctx.globalAlpha = layer.opacity || 1; // NOT divided by 100!
          ctx.globalCompositeOperation = layer.blendMode || "source-over";

          // Draw temp canvas onto main canvas (this properly composites)
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    });

    // Reset context properties (EXACTLY like LiveDrawingArea)
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Scale to thumbnail size
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

/**
 * Estimate file size of artwork
 */
const estimateFileSize = (artwork: Artwork): string => {
  let totalPixels = 0;
  const dimensions = extractDimensions(artwork);

  artwork.layers.forEach((layer) => {
    Object.values(layer.frames).forEach((frame) => {
      if (frame) {
        totalPixels += dimensions.width * dimensions.height;
      }
    });
  });

  const estimatedBytes = totalPixels * 4; // 4 bytes per pixel (RGBA)
  const estimatedKB = Math.round(estimatedBytes / 1024);

  if (estimatedKB < 1024) {
    return `${estimatedKB} KB`;
  }

  return `${Math.round(estimatedKB / 1024)} MB`;
};
