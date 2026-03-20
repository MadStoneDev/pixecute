import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  ArtStoreProperties,
  ArtStoreState,
  Artwork,
  Layer,
  ToolId,
  ToolToggleSettings,
} from "@/types/canvas";
import { DefaultColours } from "@/data/DefaultColours";
import { cloneArtwork } from "@/utils/History";

const MAX_HISTORY = 50;

const initialState: ArtStoreProperties = {
  keyIdentifier: "",
  canvasSize: {
    width: 16,
    height: 16,
  },

  liveArtwork: {
    layers: [],
    frames: [],
  },
  hasChanged: false,

  canvasBackground: "transparent",
  selectedLayer: 0,
  selectedFrame: 0,
  previousTool: "picker",
  selectedTool: "pencil",
  toolToggleSetting: "always-eraser",
  selectedColour: "#000000",
  currentAlpha: 1,
  colourPalette: DefaultColours,
  isSaving: false,
  selectedArea: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
  moveAllLayers: false,
  showGrid: false,
  onionSkinning: false,
  brushSize: 1,
  pressureMode: "none",

  undoStack: [],
  redoStack: [],
};

// In-memory Storage for Fallback
const memoryStorage: { [key: string]: string } = {};

const useArtStore = create<ArtStoreState>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      setKeyIdentifier: (key: string) => {
        set({ keyIdentifier: key });
      },
      setCanvasSize: (size: { width: number; height: number }) =>
        set({ canvasSize: size }),
      setCanvasBackground: (background: string) =>
        set({ canvasBackground: background }),
      setSelectedLayer: (layer: number) => set({ selectedLayer: layer }),
      setSelectedFrame: (frame: number | ((prevFrame: number) => number)) => {
        set((state) => {
          const newFrame =
            typeof frame === "function" ? frame(state.selectedFrame) : frame;
          state.selectedFrame = newFrame;
        });
      },
      setPreviousTool: (tool: ToolId) => set({ previousTool: tool }),
      setSelectedTool: (tool: ToolId) => set({ selectedTool: tool }),
      setSelectedColour: (colour: string) => set({ selectedColour: colour }),
      setCurrentAlpha: (alpha: number) => set({ currentAlpha: alpha }),
      setToolToggleSetting: (setting: ToolToggleSettings) =>
        set({ toolToggleSetting: setting }),
      setColourPalette: (colours: string[]) => set({ colourPalette: colours }),
      updateColourInPalette: (colour: string, index: number) => {
        set((state) => {
          if (index >= 0 && index < state.colourPalette.length) {
            state.colourPalette[index] = colour;
          }
        });
      },
      addColourToPalette: (colour: string) =>
        set((state) => {
          state.colourPalette.push(colour);
        }),
      setIsSaving: (isSaving: boolean) => set({ isSaving }),
      setSelectedArea: (area: {
        start: { x: number; y: number };
        end: { x: number; y: number };
      }) => set({ selectedArea: area }),

      setLiveArtwork: (artwork: Artwork) => set({ liveArtwork: artwork }),
      setHasChanged: (hasChanged: boolean) => set({ hasChanged }),

      updateLayer: (layerIndex, updates) => {
        set((state) => {
          const layer = state.liveArtwork.layers[layerIndex];
          if (layer) {
            Object.assign(layer, updates);
            state.hasChanged = true;
          }
        });
      },

      setMoveAllLayers: (moveAllLayers: boolean) => set({ moveAllLayers }),
      setShowGrid: (show: boolean) => set({ showGrid: show }),
      setOnionSkinning: (enabled: boolean) => set({ onionSkinning: enabled }),
      setBrushSize: (size: number) =>
        set({ brushSize: Math.max(1, Math.min(16, size)) }),
      setPressureMode: (mode) => set({ pressureMode: mode }),

      // --- History / Undo-Redo ---
      pushToHistory: (description: string) => {
        set((state) => {
          const snapshot = cloneArtwork(state.liveArtwork);
          state.undoStack.push({ artwork: snapshot, description });
          if (state.undoStack.length > MAX_HISTORY) {
            state.undoStack.shift();
          }
          state.redoStack = [];
        });
      },

      undo: () => {
        set((state) => {
          if (state.undoStack.length === 0) return;

          const entry = state.undoStack.pop()!;
          // Push current state to redo
          state.redoStack.push({
            artwork: cloneArtwork(state.liveArtwork),
            description: entry.description,
          });
          // Restore
          state.liveArtwork = entry.artwork;
          state.hasChanged = true;
        });
      },

      redo: () => {
        set((state) => {
          if (state.redoStack.length === 0) return;

          const entry = state.redoStack.pop()!;
          // Push current state to undo
          state.undoStack.push({
            artwork: cloneArtwork(state.liveArtwork),
            description: entry.description,
          });
          // Restore
          state.liveArtwork = entry.artwork;
          state.hasChanged = true;
        });
      },

      clearHistory: () => {
        set({ undoStack: [], redoStack: [] });
      },

      reset: () => set(initialState),
    })),
    {
      name: `pixecute-art-store`,
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: (key: string): string | null =>
                memoryStorage[key] ?? null,
              setItem: (key: string, value: string) => {
                memoryStorage[key] = value;
              },
              removeItem: (key: string) => {
                delete memoryStorage[key];
              },
            },
      ),
      // Only persist UI preferences, not artwork data
      partialize: (state) => ({
        keyIdentifier: state.keyIdentifier,
        canvasSize: state.canvasSize,
        canvasBackground: state.canvasBackground,
        selectedTool: state.selectedTool,
        previousTool: state.previousTool,
        toolToggleSetting: state.toolToggleSetting,
        selectedColour: state.selectedColour,
        currentAlpha: state.currentAlpha,
        colourPalette: state.colourPalette,
        moveAllLayers: state.moveAllLayers,
        showGrid: state.showGrid,
        onionSkinning: state.onionSkinning,
        brushSize: state.brushSize,
        pressureMode: state.pressureMode,
      }),
    },
  ),
);

export default useArtStore;
