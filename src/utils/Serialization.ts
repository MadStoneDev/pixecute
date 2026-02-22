// ImageData serialization utilities for JSON export/import

export interface SerializedImageData {
  width: number;
  height: number;
  data: string; // base64-encoded Uint8ClampedArray
}

export const serializeImageData = (
  imageData: ImageData,
): SerializedImageData => {
  // Convert Uint8ClampedArray to base64
  const bytes = new Uint8Array(imageData.data.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const data = btoa(binary);

  return {
    width: imageData.width,
    height: imageData.height,
    data,
  };
};

export const deserializeImageData = (
  serialized: SerializedImageData,
): ImageData => {
  const binary = atob(serialized.data);
  const bytes = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new ImageData(bytes, serialized.width, serialized.height);
};

// Serialize an entire artwork for JSON export
export const serializeArtwork = (artwork: any): any => {
  return {
    ...artwork,
    layers: artwork.layers.map((layer: any) => ({
      ...layer,
      frames: layer.frames.map((frame: ImageData | null) =>
        frame ? serializeImageData(frame) : null,
      ),
    })),
  };
};

// Deserialize an artwork from JSON import
export const deserializeArtwork = (data: any): any => {
  return {
    ...data,
    layers: data.layers.map((layer: any) => ({
      ...layer,
      frames: layer.frames.map((frame: SerializedImageData | null) =>
        frame && frame.data && frame.width && frame.height
          ? deserializeImageData(frame)
          : null,
      ),
    })),
  };
};
