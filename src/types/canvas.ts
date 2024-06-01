import React from "react";

export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

export type RawColour = Uint8ClampedArray;
export type ColourObject = { colour: {}; alpha: number };
export type GetColourResponse = RawColour | ColourObject;
export type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

export interface ArtTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  subTools?: ArtTool[];
}

export interface Layer {
  name: string;
  opacity: number;
  visible: boolean;
  frames: { [key: number]: ImageData | null };
}

export interface CanvasEditorProps {
  setColour?: (colour: string, alpha: number) => void;
  currentColour?: ColourObject;
  currentTool?: ArtTool;
  config?: CanvasConfig;
}
