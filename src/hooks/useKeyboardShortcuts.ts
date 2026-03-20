import { useEffect } from "react";
import useArtStore from "@/utils/Zustand";
import { ToolId } from "@/types/canvas";

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useArtStore.getState();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // --- Undo/Redo ---
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        state.undo();
        return;
      }

      if (
        (isCtrlOrCmd && e.key === "z" && e.shiftKey) ||
        (isCtrlOrCmd && e.key === "y")
      ) {
        e.preventDefault();
        state.redo();
        return;
      }

      // --- Save ---
      if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault();
        // hasChanged triggers auto-save
        state.setHasChanged(true);
        return;
      }

      // --- Grid Toggle ---
      if (isCtrlOrCmd && e.key === "g") {
        e.preventDefault();
        state.setShowGrid(!state.showGrid);
        return;
      }

      // Don't process tool shortcuts when modifier keys are held
      if (isCtrlOrCmd || e.altKey) return;

      // --- Tool shortcuts ---
      const toolKeyMap: Record<string, ToolId> = {
        b: "pencil",
        e: "eraser",
        g: "fill",
        v: "move",
        m: "select",
        i: "picker",
        l: "line",
        r: "rectangle",
      };

      const toolId = toolKeyMap[e.key.toLowerCase()];
      if (toolId) {
        e.preventDefault();
        state.setPreviousTool(state.selectedTool);
        state.setSelectedTool(toolId);
        return;
      }

      // --- Onion Skinning toggle ---
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        state.setOnionSkinning(!state.onionSkinning);
        return;
      }

      // --- Colour shortcuts ---
      if (e.key.toLowerCase() === "x") {
        // Swap foreground colour to black/white toggle
        e.preventDefault();
        const current = state.selectedColour;
        state.setSelectedColour(current === "#000000" ? "#ffffff" : "#000000");
        return;
      }

      if (e.key.toLowerCase() === "d") {
        // Reset to black
        e.preventDefault();
        state.setSelectedColour("#000000");
        state.setCurrentAlpha(1);
        return;
      }

      // --- Frame navigation ---
      if (e.key === "," || e.key === "<") {
        e.preventDefault();
        const prevFrame = Math.max(0, state.selectedFrame - 1);
        state.setSelectedFrame(prevFrame);
        return;
      }

      if (e.key === "." || e.key === ">") {
        e.preventDefault();
        const maxFrame = state.liveArtwork.frames.length - 1;
        const nextFrame = Math.min(maxFrame, state.selectedFrame + 1);
        state.setSelectedFrame(nextFrame);
        return;
      }

      // --- Brush size ---
      if (e.key === "[") {
        e.preventDefault();
        state.setBrushSize(state.brushSize - 1);
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        state.setBrushSize(state.brushSize + 1);
        return;
      }

      // --- Layer selection by number (1-9) ---
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const layerIndex = num - 1;
        if (layerIndex < state.liveArtwork.layers.length) {
          e.preventDefault();
          state.setSelectedLayer(layerIndex);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
