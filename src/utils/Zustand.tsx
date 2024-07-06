import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  ArtStoreProperties,
  ArtStoreState,
  ToolToggleSettings,
} from "@/types/canvas";
import { DefaultColours } from "@/data/DefaultColours";
import { state } from "sucrase/dist/types/parser/traverser/base";

const initialState: ArtStoreProperties = {
  keyIdentifier: "",
  canvasSize: {
    width: 16,
    height: 16,
  },
  canvasBackground: "transparent",
  selectedLayer: 0,
  selectedFrame: 0,
  previousTool: 2,
  selectedTool: 1,
  toolToggleSetting: "always-eraser",
  selectedColour: "#000000",
  currentAlpha: 1,
  colourPalette: DefaultColours,
  isSaving: false,
};

const useArtStore = create<ArtStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectedArea: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
      setKeyIdentifier: (key: string) => set({ keyIdentifier: key }),
      setCanvasSize: (size: { width: number; height: number }) =>
        set({ canvasSize: size }),
      setCanvasBackground: (background: string) =>
        set({ canvasBackground: background }),
      setSelectedLayer: (layer: number) => set({ selectedLayer: layer }),
      setSelectedFrame: (frame: number | ((prevFrame: number) => number)) => {
        set((state) => {
          const newFrame =
            typeof frame === "function" ? frame(state.selectedFrame) : frame;
          return { selectedFrame: newFrame };
        });
      },
      setPreviousTool: (tool: number) => set({ previousTool: tool }),
      setSelectedTool: (tool: number) => set({ selectedTool: tool }),
      setSelectedColour: (colour: string) => set({ selectedColour: colour }),
      setCurrentAlpha: (alpha: number) => set({ currentAlpha: alpha }),
      setToolToggleSetting: (setting: ToolToggleSettings) =>
        set({ toolToggleSetting: setting }),
      setColourPalette: (colours: string[]) => set({ colourPalette: colours }),
      updateColourInPalette: (colour: string, index: number) => {
        const palette = get().colourPalette.slice();
        if (index >= 0 && index < palette.length) {
          palette[index] = colour;
          set({ colourPalette: palette });
        }
      },
      addColourToPalette: (colour: string) =>
        set((state) => ({ colourPalette: [...state.colourPalette, colour] })),
      setIsSaving: (isSaving: boolean) => set({ isSaving: isSaving }),
      setSelectedArea: (area: {
        start: { x: number; y: number };
        end: { x: number; y: number };
      }) => set({ selectedArea: area }),
      reset: () => set(initialState),
    }),
    {
      name: `pixecute-art-store`,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useArtStore;
