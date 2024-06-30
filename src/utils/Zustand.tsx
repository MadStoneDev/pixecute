import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ArtStoreState } from "@/types/canvas";
import { DefaultColours } from "@/data/DefaultColours";

const useArtStore = create<ArtStoreState>()(
  persist(
    (set, get) => ({
      keyIdentifier: "",
      canvasSize: {
        width: 16,
        height: 16,
      },
      canvasBackground: "transparent",
      selectedLayer: 0,
      selectedFrame: 1,
      previousTool: 1,
      selectedTool: 1,
      selectedColour: "#000000",
      colourPalette: DefaultColours,
      isSaving: false,
      setIsSaving: (isSaving: boolean) => set({ isSaving: isSaving }),
      setKeyIdentifier: (key: string) => set({ keyIdentifier: key }),
      setCanvasSize: (size: { width: number; height: number }) =>
        set({ canvasSize: size }),
      setCanvasBackground: (background: string) =>
        set({ canvasBackground: background }),
      setSelectedLayer: (layer: number) => set({ selectedLayer: layer }),
      setSelectedFrame: (frame: number) => set({ selectedFrame: frame }),
      setPreviousTool: (tool: number) => set({ previousTool: tool }),
      setSelectedTool: (tool: number) => set({ selectedTool: tool }),
      setSelectedColour: (colour: string) => set({ selectedColour: colour }),
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
    }),
    {
      name: `pixecute-art-store`,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useArtStore;
