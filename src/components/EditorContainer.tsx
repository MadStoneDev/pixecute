"use client";

import CanvasLayer from "@/components/CanvasLayer";
import React, { useState } from "react";
import { IconEraser, IconPencil } from "@tabler/icons-react";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface CanvasEditorProps {
  config?: CanvasConfig;
}

export default function EditorContainer({ config }: CanvasEditorProps) {
  // States
  const [currentColour, setCurrentColour] = useState("#000");
  const [selectedColour, setSelectedColour] = useState(0);

  const [selectedTool, setSelectedTool] = useState(0);

  return (
    <main className={`flex flex-col sm:flex-row w-full h-dvh overflow-hidden`}>
      {/* Colours */}
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
              className={`cursor-pointer rounded-lg min-w-6 max-w-9 ${
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

      {/* Drawing Area */}
      <section
        className={`flex-grow p-5 md:p-10 flex items-center justify-center bg-neutral-700`}
      >
        <article className={`w-full h-full max-w-full max-h-full`}>
          <CanvasLayer
            config={config}
            colour={currentColour}
            tool={DEFAULT_TOOLS[selectedTool]}
          />
        </article>
      </section>

      {/* Toolbar */}
      <section className={`p-2 py-3 md:pt-4 min-w-16 bg-neutral-800`}>
        <article
          className={`relative p-1 grid grid-cols-11 sm:grid-cols-1 gap-5 w-fit sm:w-full`}
        >
          {DEFAULT_TOOLS.map((tool, index) => (
            <div
              key={`tool-${index}`}
              className={`cursor-pointer p-1 flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl border border-neutral-500 ${
                selectedTool === index
                  ? "bg-neutral-100 text-neutral-800"
                  : "hover:bg-neutral-600/50 text-neutral-100"
              } transition-all duration-300`}
              style={{ aspectRatio: 1 }}
              onClick={() => setSelectedTool(index)}
            >
              {tool.icon}
              <p className={`text-xs capitalize`}>{tool.name}</p>
            </div>
          ))}
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

const DEFAULT_TOOLS = [
  {
    name: "Pencil",
    icon: <IconPencil size={24} />,
  },
  {
    name: "Eraser",
    icon: <IconEraser size={24} />,
  },
];
