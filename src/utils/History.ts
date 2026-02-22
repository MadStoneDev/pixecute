import { Artwork, Layer } from "@/types/canvas";

const MAX_HISTORY = 50;

export interface HistoryEntry {
  artwork: Artwork;
  description: string;
}

export interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

export const initialHistoryState: HistoryState = {
  undoStack: [],
  redoStack: [],
};

/** Deep clone an artwork including all ImageData buffers */
export const cloneArtwork = (artwork: Artwork): Artwork => {
  const clonedLayers: Layer[] = artwork.layers.map((layer) => ({
    ...layer,
    frames: layer.frames.map((frame) => {
      if (!frame) return null;
      return new ImageData(
        new Uint8ClampedArray(frame.data),
        frame.width,
        frame.height,
      );
    }),
  }));

  return {
    ...artwork,
    layers: clonedLayers,
    frames: [...artwork.frames],
  };
};

/** Push a snapshot to the undo stack, clear redo */
export const pushHistory = (
  state: HistoryState,
  artwork: Artwork,
  description: string,
): HistoryState => {
  const entry: HistoryEntry = {
    artwork: cloneArtwork(artwork),
    description,
  };

  const newStack = [...state.undoStack, entry];
  // Trim to max size
  if (newStack.length > MAX_HISTORY) {
    newStack.shift();
  }

  return {
    undoStack: newStack,
    redoStack: [], // Clear redo on new action
  };
};
