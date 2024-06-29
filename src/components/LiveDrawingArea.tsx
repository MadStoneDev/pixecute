"use client";

import React, { useState, useEffect, useRef } from "react";

import useArtStore from "@/utils/Zustand";
import { DummyArtwork } from "@/data/DummyArtwork";
import { currentMousePosition } from "@/utils/Drawing";
import { colourBackground, regenerateCanvasLayers } from "@/utils/CanvasLayers";
import { DRAWING_TOOLS } from "@/data/DefaultTools";
import { Mouse } from "lucide-react";

const LiveDrawingArea = () => {
  // Hooks
  // States
  const [dominantDimension, setDominantDimension] = useState<string>("width");
  const [liveLayers, setLiveLayers] = useState<HTMLCanvasElement[]>([]);
  const [startDrawing, setStartDrawing] = useState<boolean>(false);
  const [startMoving, setStartMoving] = useState<boolean>(false);
  const [waitForDoubleClick, setWaitForDoubleClick] = useState<boolean>(false);
  const [doubleClickTime, setDoubleClickTime] = useState<number>(0);
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
    previousTool,
    selectedTool,
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

  useEffect(() => {
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

          console.log(doubleClickTime, timeNow, timeNow - doubleClickTime);

          if (timeNow - doubleClickTime < DOUBLE_CLICK_DELAY) {
            setCanvasZoom(1);
            setCanvasPosition({ x: 0, y: 0 });

            setDoubleClickTime(0);
            setWaitForDoubleClick(false);
          } else {
            setDoubleClickTime(timeNow);
            setWaitForDoubleClick(true);
          }
        }
      }}
    >
      <article
        ref={wrapperRef}
        className={`mx-auto relative ${
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
          if (event.pointerType === "mouse") {
            // Mouse
            // ==> left-click applies tools with "up" trigger
            // ==> middle-click toggles previous and current tools
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
        onPointerMove={(event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;

          if (startDrawing) {
          } else if (startMoving) {
            setCanvasPosition((prevPosition) => ({
              x: prevPosition.x + event.movementX,
              y: prevPosition.y + event.movementY,
            }));
          }

          currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );
        }}
        onPointerOut={(event: React.PointerEvent<HTMLDivElement>) => {
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
