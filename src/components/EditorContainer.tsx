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
  const [selectedColour, setSelectedColour] = useState(1);

  return (
    <main
      className={`grid grid-cols-12 items-center justify-stretch gap-5 w-full`}
    >
      <section
        className={`col-span-1 p-2 grid grid-cols-2 place-content-start gap-1 w-20 h-full bg-neutral-800`}
      >
        {DEFAULT_COLOUR_PALETTE.map((colour, index) => (
          <div
            key={`colour-palette-${index}`}
            className={`rounded-lg ${
              selectedColour === index ? "border-2 border-white" : ""
            }`}
            style={{ backgroundColor: colour, aspectRatio: 1 }}
            onClick={() => {
              setCurrentColour(colour);
              setSelectedColour(index);
            }}
          ></div>
        ))}
      </section>
      <section className={`m-5 col-span-11 h-[500px]`}>
        <CanvasLayer config={config} colour={currentColour} />
      </section>
    </main>
  );
}

const DEFAULT_COLOUR_PALETTE = [
  "#fff",
  "#000000",
  "#dc2626",
  "#ea580c",
  "#65a30d",
  "#2563eb",
  "#a21caf",
  "#db2777",
];
