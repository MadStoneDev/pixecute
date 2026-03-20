// utils/SpriteSheetExporter.ts
import { Artwork, AnimationGroup } from "@/types/canvas";

export interface SpriteSheetOptions {
  frameIndices?: number[]; // specific frames, defaults to all
  columns?: number; // grid columns, auto-calculated if omitted
  scale?: number; // scale multiplier, default 1
  format?: "png" | "jpg";
  jpgQuality?: number; // 0-1, default 0.92
  includeMetadata?: boolean; // export JSON metadata alongside
}

export interface SpriteSheetMetadata {
  frames: {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    duration: number;
  }[];
  spriteSheet: {
    width: number;
    height: number;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    rows: number;
    scale: number;
  };
}

/**
 * Generate a sprite sheet canvas + metadata from artwork frames.
 */
export const generateSpriteSheet = (
  artwork: Artwork,
  options: SpriteSheetOptions = {},
): { canvas: HTMLCanvasElement; metadata: SpriteSheetMetadata } => {
  const { scale = 1, format = "png" } = options;
  const frameIndices =
    options.frameIndices ??
    Array.from({ length: artwork.frames.length }, (_, i) => i);

  const firstLayer = artwork.layers[0];
  const firstFrame = firstLayer?.frames[0];
  if (!firstFrame) throw new Error("Artwork has no frame data");

  const srcWidth = firstFrame.width;
  const srcHeight = firstFrame.height;
  const frameWidth = srcWidth * scale;
  const frameHeight = srcHeight * scale;

  const totalFrames = frameIndices.length;
  const columns =
    options.columns ?? Math.ceil(Math.sqrt(totalFrames));
  const rows = Math.ceil(totalFrames / columns);

  const sheetWidth = columns * frameWidth;
  const sheetHeight = rows * frameHeight;

  const sheetCanvas = document.createElement("canvas");
  sheetCanvas.width = sheetWidth;
  sheetCanvas.height = sheetHeight;
  const sheetCtx = sheetCanvas.getContext("2d")!;
  sheetCtx.imageSmoothingEnabled = false;

  // Temp canvases for compositing
  const compCanvas = document.createElement("canvas");
  compCanvas.width = srcWidth;
  compCanvas.height = srcHeight;
  const compCtx = compCanvas.getContext("2d")!;
  compCtx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = srcWidth;
  tempCanvas.height = srcHeight;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = false;

  const metadata: SpriteSheetMetadata = {
    frames: [],
    spriteSheet: {
      width: sheetWidth,
      height: sheetHeight,
      frameWidth,
      frameHeight,
      columns,
      rows,
      scale,
    },
  };

  frameIndices.forEach((fi, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * frameWidth;
    const y = row * frameHeight;

    // Composite layers for this frame
    compCtx.clearRect(0, 0, srcWidth, srcHeight);
    artwork.layers.forEach((layer) => {
      if (layer.visible && layer.frames[fi]) {
        const imageData = layer.frames[fi];
        if (imageData) {
          tempCtx.clearRect(0, 0, srcWidth, srcHeight);
          tempCtx.putImageData(imageData, 0, 0);
          compCtx.globalAlpha = layer.opacity ?? 1;
          compCtx.globalCompositeOperation =
            layer.blendMode || "source-over";
          compCtx.drawImage(tempCanvas, 0, 0);
        }
      }
    });
    compCtx.globalAlpha = 1;
    compCtx.globalCompositeOperation = "source-over";

    // Draw composited frame onto sheet
    sheetCtx.drawImage(
      compCanvas,
      0,
      0,
      srcWidth,
      srcHeight,
      x,
      y,
      frameWidth,
      frameHeight,
    );

    metadata.frames.push({
      index: fi,
      x,
      y,
      width: frameWidth,
      height: frameHeight,
      duration: artwork.frames[fi] ?? 100,
    });
  });

  return { canvas: sheetCanvas, metadata };
};

/**
 * Export and download sprite sheet.
 */
export const downloadSpriteSheet = (
  artwork: Artwork,
  filename: string,
  options: SpriteSheetOptions = {},
): void => {
  const { format = "png", jpgQuality = 0.92, includeMetadata = true } = options;
  const { canvas, metadata } = generateSpriteSheet(artwork, options);

  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
  const ext = format === "jpg" ? "jpg" : "png";

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_spritesheet.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    mimeType,
    format === "jpg" ? jpgQuality : undefined,
  );

  if (includeMetadata) {
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `${filename}_spritesheet.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
  }
};

export interface CombinedGroupsMetadata {
  groups: {
    name: string;
    frames: {
      index: number;
      x: number;
      y: number;
      width: number;
      height: number;
      duration: number;
    }[];
  }[];
  spriteSheet: {
    width: number;
    height: number;
    frameWidth: number;
    frameHeight: number;
    scale: number;
  };
}

/**
 * Export all animation groups as a single sprite sheet.
 * Each group gets its own row(s), with TexturePacker-style JSON metadata.
 */
export const downloadCombinedGroupsSpriteSheet = (
  artwork: Artwork,
  filename: string,
  options: Omit<SpriteSheetOptions, "frameIndices"> = {},
): void => {
  const groups = artwork.groups ?? [];
  if (groups.length === 0) return;

  const { scale = 1, includeMetadata = true } = options;

  const firstFrame = artwork.layers[0]?.frames[0];
  if (!firstFrame) return;

  const srcWidth = firstFrame.width;
  const srcHeight = firstFrame.height;
  const frameWidth = srcWidth * scale;
  const frameHeight = srcHeight * scale;

  // Calculate the widest row (most frames in a group) to determine sheet width
  const maxFramesInGroup = Math.max(...groups.map((g) => g.frameIndices.length));
  const sheetWidth = maxFramesInGroup * frameWidth;
  const sheetHeight = groups.length * frameHeight;

  const sheetCanvas = document.createElement("canvas");
  sheetCanvas.width = sheetWidth;
  sheetCanvas.height = sheetHeight;
  const sheetCtx = sheetCanvas.getContext("2d")!;
  sheetCtx.imageSmoothingEnabled = false;

  const compCanvas = document.createElement("canvas");
  compCanvas.width = srcWidth;
  compCanvas.height = srcHeight;
  const compCtx = compCanvas.getContext("2d")!;
  compCtx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = srcWidth;
  tempCanvas.height = srcHeight;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = false;

  const combinedMeta: CombinedGroupsMetadata = {
    groups: [],
    spriteSheet: {
      width: sheetWidth,
      height: sheetHeight,
      frameWidth,
      frameHeight,
      scale,
    },
  };

  groups.forEach((group, gIdx) => {
    const groupMeta: CombinedGroupsMetadata["groups"][0] = {
      name: group.name,
      frames: [],
    };

    group.frameIndices.forEach((fi, col) => {
      const x = col * frameWidth;
      const y = gIdx * frameHeight;

      compCtx.clearRect(0, 0, srcWidth, srcHeight);
      artwork.layers.forEach((layer) => {
        if (layer.visible && layer.frames[fi]) {
          const imageData = layer.frames[fi];
          if (imageData) {
            tempCtx.clearRect(0, 0, srcWidth, srcHeight);
            tempCtx.putImageData(imageData, 0, 0);
            compCtx.globalAlpha = layer.opacity ?? 1;
            compCtx.globalCompositeOperation =
              layer.blendMode || "source-over";
            compCtx.drawImage(tempCanvas, 0, 0);
          }
        }
      });
      compCtx.globalAlpha = 1;
      compCtx.globalCompositeOperation = "source-over";

      sheetCtx.drawImage(compCanvas, 0, 0, srcWidth, srcHeight, x, y, frameWidth, frameHeight);

      groupMeta.frames.push({
        index: fi,
        x,
        y,
        width: frameWidth,
        height: frameHeight,
        duration: artwork.frames[fi] ?? 100,
      });
    });

    combinedMeta.groups.push(groupMeta);
  });

  // Download sprite sheet
  sheetCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_all_groups.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");

  // Download metadata
  if (includeMetadata) {
    const jsonBlob = new Blob([JSON.stringify(combinedMeta, null, 2)], {
      type: "application/json",
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `${filename}_all_groups.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);
  }
};
