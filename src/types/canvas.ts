import React from "react";

export type RawColour = Uint8ClampedArray;
export type ColourObject = { colour: {}; alpha: number };
export type GetColourResponse = RawColour | ColourObject;
export type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
  keyIdentifier?: string;
}

export interface ArtTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  subTools?: ArtTool[];
}

export interface Layer {
  id: string;
  name: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  frames: { [key: number]: ImageData | null };
}

export interface ArtworkObject {
  layers: Layer[];
  frames: number[];
}

export interface Artwork extends ArtworkObject {
  id?: number;
  keyIdentifier?: string;
}

export interface ArtworkHistory extends ArtworkObject {
  id?: number;
}
