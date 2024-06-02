"use client";

import React, { useEffect, useState } from "react";
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
import NavBar from "@/components/NavBar";
import { ColourObject } from "@/types/canvas";

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
  // initialise to pencil;
  const [selectedTool, setSelectedTool] = useState(1);

  const [maxWidth, setMaxWidth] = useState("max-w-[1000px]");

  // initialise colour to 0;
  const [selectedColour, setSelectedColour] = useState(1);
  const [currentColour, setCurrentColour] = useState<ColourObject>({
    colour: DEFAULT_COLOUR_PALETTE[1],
    alpha: 255,
  });

  const handleColourChange = (colour: string, alpha: number) => {
    setCurrentColour({ colour: colour.toUpperCase(), alpha });
    setSelectedColour(DEFAULT_COLOUR_PALETTE.indexOf(colour.toUpperCase()));
  };

  useEffect(() => {
    setTimeout(() => {
      setMaxWidth("max-w-full");
    }, 700);
  }, []);

  return (
    <main
      className={`flex flex-col w-full h-dvh ${maxWidth} overflow-hidden transition-all duration-300`}
    >
      {/* Main Nav */}
      <NavBar />

      <section
        className={`flex flex-col sm:flex-row w-full h-dvh overflow-hidden`}
      >
        {/* Toolbar */}
        <section
          className={`p-2 py-3 md:pt-4 min-w-16 bg-white dark:bg-neutral-900 z-20`}
        >
          <article
            className={`relative p-1 flex sm:grid sm:grid-cols-1 gap-5 w-fit sm:w-full`}
          >
            {DEFAULT_TOOLS.map((tool, index) => (
              <div
                key={`tool-${index}`}
                className={`cursor-pointer p-1 flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl ${
                  selectedTool === index
                    ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900"
                    : "hover:bg-neutral-600/50 text-neutral-900 dark:text-neutral-100"
                } transition-all duration-300`}
                style={{ aspectRatio: 1 }}
                onClick={() => {
                  setSelectedTool(index);
                }}
              >
                {tool.icon}
              </div>
            ))}
          </article>
        </section>

        {/* Drawing Area */}
        <CanvasContainer
          config={config}
          currentColour={currentColour}
          setColour={handleColourChange}
          currentTool={DEFAULT_TOOLS[selectedTool]}
        />

        {/* Colours */}
        <section className={`min-w-20 bg-white dark:bg-neutral-900 z-20`}>
          <article
            className={`relative mx-auto grid grid-cols-11 sm:grid-cols-2 w-full sm:w-full`}
          >
            <div
              className={`col-span-2 my-4 mx-2 rounded-full shadow-xl shadow-neutral-900/20`}
              style={{
                aspectRatio: 1,
                backgroundColor: currentColour.colour as string,
              }}
            ></div>
            {DEFAULT_COLOUR_PALETTE.map((colour, index) => (
              <div
                key={`colour-palette-${index}`}
                className={`cursor-pointer ${
                  selectedColour === index ? "" : ""
                } transition-all duration-300`}
                style={{ backgroundColor: colour, aspectRatio: 1 }}
                onClick={() => {
                  handleColourChange(colour, 255);
                }}
              ></div>
            ))}
          </article>
        </section>
      </section>
    </main>
  );
}

const DEFAULT_COLOUR_PALETTE = [
  "#FFFFFF", // White
  "#000000", // Black
  "#ECF0F1", // Clouds
  "#BDC3C7", // Silver
  "#95A5A6", // Concrete
  "#7F8C8D", // Asbestos
  "#F1C40F", // Sun Flower
  "#F39C12", // Orange
  "#E67E22", // Carrot
  "#D35400", // Pumpkin
  "#E74C3C", // Alizarin
  "#C0392B", // Pomegranate
  "#2ECC71", // Emerald
  "#27AE60", // Nephritis
  "#1ABC9C", // Turquoise
  "#16A085", // Green Sea
  "#3498DB", // Peter River
  "#2980B9", // Belize Hole
  "#9B59B6", // Amethyst
  "#8E44AD", // Wisteria
  "#34495E", // Wet Asphalt
  "#2C3E50", // Midnight Blue
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
