"use client";

import React, { useState, useEffect, useRef } from "react";

import useArtStore from "@/utils/Zustand";
import { DummyArtwork } from "@/data/DummyArtwork";
import { colourBackground, regenerateCanvasLayers } from "@/utils/CanvasLayers";

const LiveDrawingArea = () => {
  // Hooks
  // States
  const [liveLayers, setLiveLayers] = useState<HTMLCanvasElement[]>([]);
  const [backgroundLookup, setBackgroundLookup] = useState<{
    [key: string]: string;
  }>({
    transparent: "",
    white: "#ffffff",
    black: "#000000",
  });

  // Zustands
  const {
    keyIdentifier,
    canvasSize,
    canvasBackground,
    selectedLayer,
    selectedFrame,
    previousTool,
    selectedTool,
  } = useArtStore();

  // Refs
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLiveLayers(
      regenerateCanvasLayers(DummyArtwork.layers, selectedFrame, canvasSize),
    );

    const backgroundCanvas = canvasBackgroundRef.current;
    if (backgroundCanvas) colourBackground(canvasBackground, backgroundCanvas);
  }, [
    selectedFrame,
    DummyArtwork.layers,
    canvasBackgroundRef,
    canvasBackground,
  ]);

  return (
    <section className={`w-full h-full`}>
      {/* Saving Indicator */}

      <article
        className={`mx-auto relative top-1/2 -translate-y-1/2 ${
          canvasSize.width > canvasSize.height ? "w-[90%]" : "h-[90%]"
        } border border-neutral-100`}
        style={{
          aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
        }}
      >
        {/* Background Layer */}
        <canvas
          ref={canvasBackgroundRef}
          className={`absolute top-0 left-0 w-full h-full`}
          style={{
            imageRendering: "pixelated",
          }}
          width={16}
          height={16}
        ></canvas>

        {liveLayers.map((layer, index) => (
          <canvas
            key={`live-drawing-area-layer-${index}`}
            className={`absolute top-0 left-0 w-full h-full`}
            style={{
              imageRendering: "pixelated",
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          ></canvas>
        ))}
      </article>
    </section>
  );
};

export default LiveDrawingArea;
