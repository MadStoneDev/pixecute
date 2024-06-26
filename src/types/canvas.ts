import React from "react";

export type Colour = { r: number; g: number; b: number; a: number };
export type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

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
