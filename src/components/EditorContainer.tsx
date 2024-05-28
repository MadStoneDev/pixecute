"use client";

import CanvasLayer from "@/components/CanvasLayer";
import React, { useState } from "react";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface CanvasEditorProps {
  config?: CanvasConfig;
}

export default function EditorContainer({ config }: CanvasEditorProps) {
  const [currentColour, setCurrentColour] = useState("#000");
  const [selectedColour, setSelectedColour] = useState(0);

  return (
    <main className={`flex flex-col sm:flex-row w-full h-dvh overflow-hidden`}>
      <section className={`p-2 py-3 md:pt-4 min-w-24 bg-neutral-800`}>
        <article
          className={`relative p-2 pt-3 grid grid-cols-11 sm:grid-cols-2 gap-1.5 w-fit sm:w-full rounded-xl border border-neutral-500`}
        >
          <span
            className={`absolute px-1 -top-2 left-2 text-xs text-neutral-400 bg-neutral-800`}
          >
            Colour
          </span>
          {DEFAULT_COLOUR_PALETTE.map((colour, index) => (
            <div
              key={`colour-palette-${index}`}
              className={`rounded-lg min-w-6 max-w-9 ${
                selectedColour === index ? "border-2 border-white" : ""
              }`}
              style={{ backgroundColor: colour, aspectRatio: 1 }}
              onClick={() => {
                setCurrentColour(colour);
                setSelectedColour(index);
              }}
            ></div>
          ))}
        </article>
      </section>

      <section
        className={`flex-grow p-5 md:p-10 flex items-center justify-center`}
      >
        <article className={`w-full h-full max-w-full max-h-full`}>
          <CanvasLayer config={config} colour={currentColour} />
        </article>
      </section>
    </main>
  );
}

const DEFAULT_COLOUR_PALETTE = [
  "#000000", // Black
  "#FFFFFF", // White
  "#DC143C", // Crimson Red
  "#E0115F", // Ruby Red
  "#F28500", // Tangerine Orange
  "#FF4500", // Sunset Orange
  "#FFD700", // Golden Yellow
  "#FFF44F", // Lemon Yellow
  "#7FFF00", // Chartreuse Green
  "#228B22", // Forest Green
  "#008080", // Teal
  "#40E0D0", // Turquoise
  "#87CEEB", // Sky Blue
  "#4169E1", // Royal Blue
  "#4B0082", // Indigo
  "#EE82EE", // Violet
  "#FF00FF", // Magenta
  "#FFC0CB", // Pink
  "#E6E6FA", // Lavender
  "#FFDAB9", // Peach
  "#808000", // Olive Green
  "#8B4513", // Brown
];
