"use client";

import React, { useState } from "react";
import CanvasContainer from "@/components/CanvasContainer";
import {
  IconArrowsMove,
  IconBrush,
  IconColorPicker,
  IconEraser,
  IconLine,
  IconMarquee2,
  IconPaint,
  IconPencil,
  IconShape,
} from "@tabler/icons-react";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface CanvasEditorProps {
  config?: CanvasConfig;
}

type RawColour = Uint8ClampedArray;
type ColourObject = { colour: {}; alpha: number };
type GetColourResponse = RawColour | ColourObject;
type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

export default function EditorContainer({ config }: CanvasEditorProps) {
  // States
  // initialise to pencil;
  const [selectedTool, setSelectedTool] = useState(1);

  // initialise colour to 0;
  const [selectedColour, setSelectedColour] = useState(0);
  const [currentColour, setCurrentColour] = useState<ColourObject>({
    colour: DEFAULT_COLOUR_PALETTE[0],
    alpha: 255,
  });

  const handleColourChange = (colour: string, alpha: number) => {
    setCurrentColour({ colour: colour.toUpperCase(), alpha });
    setSelectedColour(DEFAULT_COLOUR_PALETTE.indexOf(colour.toUpperCase()));
  };

  return (
    <main className={`flex flex-col sm:flex-row w-full h-dvh overflow-hidden`}>
      {/* Colours */}
      <section className={`p-2 py-3 md:pt-4 min-w-28 bg-neutral-900 z-50`}>
        <article
          className={`relative mx-auto p-2 pt-3 grid grid-cols-11 sm:grid-cols-2 gap-3 w-full sm:w-full rounded-xl border border-neutral-500`}
        >
          <span
            className={`absolute px-1 -top-2 left-2 text-xs text-neutral-400 bg-neutral-800`}
          >
            Colour
          </span>
          {DEFAULT_COLOUR_PALETTE.map((colour, index) => (
            <div
              key={`colour-palette-${index}`}
              className={`cursor-pointer rounded-lg sm:rounded-xl min-w-6 max-w-9 ${
                selectedColour === index ? "border-2 border-white" : ""
              }`}
              style={{ backgroundColor: colour, aspectRatio: 1 }}
              onClick={() => {
                handleColourChange(colour, 255);
              }}
            ></div>
          ))}
        </article>
      </section>

      {/* Drawing Area */}
      <section className={`flex-grow p-5 w-full h-full bg-neutral-700`}>
        <CanvasContainer
          config={config}
          currentColour={currentColour}
          setColour={handleColourChange}
          currentTool={DEFAULT_TOOLS[selectedTool]}
        />
      </section>

      {/* Toolbar */}
      <section className={`p-2 py-3 md:pt-4 min-w-16 bg-neutral-900 z-50`}>
        <article
          className={`relative p-1 flex sm:grid sm:grid-cols-1 gap-5 w-fit sm:w-full`}
        >
          {DEFAULT_TOOLS.map((tool, index) => (
            <div
              key={`tool-${index}`}
              className={`cursor-pointer p-1 flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl ${
                selectedTool === index
                  ? "bg-neutral-100 text-neutral-800"
                  : "hover:bg-neutral-600/50 text-neutral-100"
              } transition-all duration-300`}
              style={{ aspectRatio: 1 }}
              onClick={() => setSelectedTool(index)}
            >
              {tool.icon}
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

interface ArtTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  subTools?: ArtTool[];
}

const DEFAULT_TOOLS: ArtTool[] = [
  {
    name: "Select",
    icon: <IconMarquee2 size={30} />,
    trigger: "down",
  },
  {
    name: "Pencil",
    icon: <IconPencil size={30} />,
    trigger: "down",
  },
  {
    name: "Brush",
    icon: <IconBrush size={28} />,
    trigger: "down",
    subTools: [
      {
        name: "Brush",
        icon: <IconBrush size={28} />,
      },
    ],
  },
  {
    name: "Picker",
    icon: <IconColorPicker size={30} />,
    trigger: "up",
  },
  {
    name: "Eraser",
    icon: <IconEraser size={28} />,
    trigger: "down",
  },
  {
    name: "Fill",
    icon: <IconPaint size={30} />,
    trigger: "up",
  },
  {
    name: "Line",
    icon: <IconLine size={30} />,
    trigger: "down",
  },
  {
    name: "Shape",
    icon: <IconShape size={30} />,
    trigger: "down",
  },
  {
    name: "Move",
    icon: <IconArrowsMove size={30} />,
    trigger: "down",
  },
];
