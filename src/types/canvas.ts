import React from "react";

export type Colour = { r: number; g: number; b: number; a: number };
export type ToolToggleSettings = "always-eraser" | "last-tool" | "smart-toggle";

// Tool IDs as string literals
export type ToolId =
  | "select"
  | "pencil"
  | "picker"
  | "eraser"
  | "fill"
  | "move"
  | "line"
  | "rectangle";

export interface HistoryEntry {
  artwork: Artwork;
  description: string;
}

export interface ArtStoreProperties {
  keyIdentifier: string;
  canvasSize: { width: number; height: number };

  liveArtwork: Artwork;
  hasChanged: boolean;

  canvasBackground: string;
  selectedLayer: number;
  selectedFrame: number;
  previousTool: ToolId;
  selectedTool: ToolId;
  toolToggleSetting: ToolToggleSettings;
  selectedColour: string;
  currentAlpha: number;
  colourPalette: string[];
  isSaving: boolean;
  selectedArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  moveAllLayers: boolean;
  showGrid: boolean;
  onionSkinning: boolean;

  // History / Undo-Redo
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

export interface ArtStoreState extends ArtStoreProperties {
  setIsSaving: (isSaving: boolean) => void;
  setKeyIdentifier: (key: string) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setCanvasBackground: (background: string) => void;
  setSelectedLayer: (layer: number) => void;
  setSelectedFrame: (frame: number | ((prevFrame: number) => number)) => void;
  setPreviousTool: (tool: ToolId) => void;
  setSelectedTool: (tool: ToolId) => void;
  setMoveAllLayers: (moveAllLayers: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setOnionSkinning: (enabled: boolean) => void;
  setToolToggleSetting: (setting: ToolToggleSettings) => void;
  setSelectedColour: (colour: string) => void;
  setColourPalette: (colours: string[]) => void;
  updateColourInPalette: (colour: string, index: number) => void;
  addColourToPalette: (colour: string) => void;
  setCurrentAlpha: (alpha: number) => void;
  setSelectedArea: (area: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  }) => void;

  setLiveArtwork: (artwork: Artwork) => void;
  setHasChanged: (hasChanged: boolean) => void;

  updateLayer: (layerIndex: number, updates: Partial<Layer>) => void;

  // History / Undo-Redo
  pushToHistory: (description: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  reset: () => void;
}

export interface DrawingTool {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  doAfter?: boolean;
}

export interface FileTool {
  name: string;
  icon: React.ReactNode;
}

export interface Artwork {
  id?: number;
  keyIdentifier?: string;
  layers: Layer[];
  frames: number[]; // frame durations in ms
}

export type BlendMode =
  | "source-over"
  | "source-in"
  | "source-out"
  | "source-atop"
  | "destination-over"
  | "destination-in"
  | "destination-out"
  | "destination-atop"
  | "lighter"
  | "copy"
  | "xor"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export interface Layer {
  id: string;
  name: string;
  opacity: number; // 0-1
  visible: boolean;
  locked: boolean;
  frames: (ImageData | null)[]; // 0-indexed array
  blendMode?: BlendMode;
}
