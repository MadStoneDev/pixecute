﻿"use client";

import React, { useState, useEffect, useRef, LegacyRef } from "react";

import useArtStore from "@/utils/Zustand";
// import { DummyArtwork } from "@/data/DummyArtwork";
import { currentMousePosition } from "@/utils/Mouse";
import { activateDrawingTool } from "@/utils/Drawing";
import { colourBackground, regenerateCanvasLayers } from "@/utils/CanvasLayers";
import { DRAWING_TOOLS } from "@/data/DefaultTools";
import { Icon, IconCrosshair, IconHandGrab } from "@tabler/icons-react";
import { createNewArtwork } from "@/utils/General";
import { NewArtwork } from "@/utils/NewArtwork";
import { Artwork } from "@/types/canvas";

const LiveDrawingArea = ({
  liveArtwork,
  setLiveArtwork,
}: {
  liveArtwork: Artwork;
  setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
}) => {
  // Hooks
  // States
  const [startDrawing, setStartDrawing] = useState<boolean>(false);
  const [startMoving, setStartMoving] = useState<boolean>(false);

  const [liveLayers, setLiveLayers] = useState<HTMLCanvasElement[]>([]);
  const [dominantDimension, setDominantDimension] = useState<string>("width");
  const [pixelReference, setPixelReference] = useState<number>(1);

  const [mouseInCanvas, setMouseInCanvas] = useState<boolean>(false);
  const [doubleClickTime, setDoubleClickTime] = useState<number>(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState<number>(1);

  const [canvasPosition, setCanvasPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const [MouseButtons] = useState({
    LeftClick: 0,
    MiddleClick: 1,
    RightClick: 2,
  });

  const Touches = useState({
    OneFinger: 0,
    TwoFingers: 1,
    ThreeFingers: 2,
  });

  // Zustands
  const {
    keyIdentifier,
    canvasSize,
    canvasBackground,
    selectedLayer,
    selectedFrame,
    selectedTool,
    selectedColour,
    setSelectedColour,
  } = useArtStore();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);

  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    setCanvasZoom((prevZoom) => {
      const newZoom = prevZoom + event.deltaY / 1000;
      return Math.min(Math.max(newZoom, 0.25), 3);
    });
  };

  // Functions
  const handleResize = () => {
    if (windowRef.current && wrapperRef.current) {
      const windowRatio =
        windowRef.current.clientWidth / windowRef.current.clientHeight;
      const canvasRatio =
        wrapperRef.current.clientWidth / wrapperRef.current.clientHeight;

      if (windowRatio > canvasRatio) {
        setDominantDimension("height");
      } else if (windowRatio < canvasRatio) {
        setDominantDimension("width");
      } else {
        if (windowRatio > 1) {
          setDominantDimension("width");
        } else {
          setDominantDimension("height");
        }
      }
    }
  };

  useEffect(() => {
    const backgroundCanvas = canvasBackgroundRef.current;
    if (backgroundCanvas) colourBackground(canvasBackground, backgroundCanvas);
    setLiveLayers(
      regenerateCanvasLayers(liveArtwork.layers, selectedFrame, canvasSize),
    );
    handleResize();
  }, []);

  return (
    <section
      ref={windowRef}
      className={`grid place-items-center w-full h-full`}
      onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
        if (
          event.pointerType === "mouse" &&
          event.button === MouseButtons.MiddleClick
        ) {
          setStartMoving(false);

          const timeNow = Date.now();
          const DOUBLE_CLICK_DELAY: number = 500;

          if (timeNow - doubleClickTime < DOUBLE_CLICK_DELAY) {
            setCanvasZoom(1);
            setCanvasPosition({ x: 0, y: 0 });

            setDoubleClickTime(0);
          } else {
            setDoubleClickTime(timeNow);
          }
        }
      }}
    >
      {startMoving ? (
        <IconHandGrab
          size={30}
          className={`pointer-events-none fixed text-neutral-100 z-50`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      ) : (
        <IconCrosshair
          size={pixelReference / 1.5}
          className={`pointer-events-none fixed text-neutral-100 z-50`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      )}

      <article
        ref={wrapperRef}
        className={`${mouseInCanvas ? "cursor-none" : ""} mx-auto relative ${
          dominantDimension === "width" ? "w-[90%]" : "h-[90%]"
        } border border-neutral-100`}
        style={{
          aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom})`,
        }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={handleZoom}
        onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
          if (event.pointerType === "mouse") {
            // Mouse
            // ==> left-click applies tools with "down" trigger
            // ==> middle-click moves canvas
            if (event.button === MouseButtons.LeftClick) {
              if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                setStartDrawing(true);
              }
            } else if (event.button === MouseButtons.MiddleClick) {
              setStartMoving(true);
            }
          } else if (event.pointerType === "touch") {
            // Touch
            // ==> one finger applies tools with "down" trigger
          } else if (event.pointerType === "pen") {
            // Stylus
            // ==> applies tools with "down" trigger
            // ==> if button is pressed, use "eraser" tool
          }
        }}
        onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;
          const { normalisedX, normalisedY } = currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );

          if (event.pointerType === "mouse") {
            // Mouse
            // ==> left-click applies tools with "up" trigger
            // ==> middle-click toggles previous and current tools
            if (event.button === MouseButtons.LeftClick) {
              if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                activateDrawingTool(
                  selectedTool,
                  selectedColour,
                  { x: 1, y: 1 },
                  normalisedX,
                  normalisedY,
                  liveArtwork,
                  selectedLayer,
                  selectedFrame,
                  setSelectedColour,
                  canvasSize,
                ).then((data) => console.log(data));
              }
            } else if (event.button === MouseButtons.MiddleClick) {
            }
          } else if (event.pointerType === "touch") {
            // Touch
            // ==> one finger applies tools with "up" trigger
            // ==> two fingers undo last action
            // ==> three fingers redo last action
          } else if (event.pointerType === "pen") {
          }

          // Stop Drawing
          setStartDrawing(false);
          // Stop Moving Canvas
          setStartMoving(false);
        }}
        onPointerMove={async (event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;

          setMousePosition({ x: clientX, y: clientY });
          setPixelReference(width / canvasSize.width);

          const { normalisedX, normalisedY } = currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );

          if (startDrawing) {
            const updatedArtwork = await activateDrawingTool(
              selectedTool,
              selectedColour,
              { x: 1, y: 1 },
              normalisedX,
              normalisedY,
              liveArtwork,
              selectedLayer,
              selectedFrame,
              setSelectedColour,
              canvasSize,
            ).then();

            setLiveArtwork(updatedArtwork);
            const updatedLayers = regenerateCanvasLayers(
              updatedArtwork.layers,
              selectedFrame,
              canvasSize,
            );

            console.log(updatedLayers);
            setLiveLayers(updatedLayers);
          } else if (startMoving) {
            setCanvasPosition((prevPosition) => ({
              x: prevPosition.x + event.movementX,
              y: prevPosition.y + event.movementY,
            }));
          }
        }}
        onPointerEnter={() => setMouseInCanvas(true)}
        onPointerOut={() => {
          setMouseInCanvas(false);
          // Stop Drawing
          setStartDrawing(false);
          // Stop Moving Canvas
          setStartMoving(false);
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
          <div
            key={`live-drawing-area-layer-${index}`}
            className={`absolute top-0 left-0 w-full h-full z-10`}
          >
            <div ref={(div) => div && div.appendChild(layer)}></div>
          </div>
        ))}
      </article>
    </section>
  );
};

export default LiveDrawingArea;
