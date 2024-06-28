import React from "react";

export type Colour = { r: number; g: number; b: number; a: number };
export type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

export interface ArtStoreState {
  keyIdentifier: string;
  canvasSize: { width: number; height: number };
  canvasBackground: string;
  selectedLayer: number;
  selectedFrame: number;
  previousTool: number;
  selectedTool: number;
  selectedColour: number;
  colourPalette: string[];
  setKeyIdentifier: (key: string) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setCanvasBackground: (background: string) => void;
  setSelectedLayer: (layer: number) => void;
  setSelectedFrame: (frame: number) => void;
  setPreviousTool: (tool: number) => void;
  setSelectedTool: (tool: number) => void;
  setSelectedColour: (colour: number) => void;
  setColourPalette: (colours: string[]) => void;
  updateColourInPalette: (colour: string, index: number) => void;
  addColourToPalette: (colour: string) => void;
}

export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
  keyIdentifier?: string;
}

export interface DrawingTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
}

export interface FileTool {
  name: string;
  icon: React.ReactNode;
}

export interface Artwork {
  id?: number;
  keyIdentifier?: string;
  layers: Layer[];
  frames: number[];
}

export interface Layer {
  name: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  frames: Frame;
}

export interface Frame {
  [key: number]: ImageData | null;
}
