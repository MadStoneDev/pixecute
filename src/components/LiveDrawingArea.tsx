// components/LiveDrawingArea.tsx

"use client";

import React, { useRef, useState, useEffect, RefObject } from "react";

import { Artwork, Layer } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";
import { DRAWING_TOOLS } from "@/data/DefaultTools";
import { currentMousePosition } from "@/utils/Mouse";
import { CustomPointer } from "@/data/CustomPointer";
import { activateDrawingTool, clearSelection } from "@/utils/Drawing";
import { colourBackground } from "@/utils/CanvasLayers";

import { PuffLoader } from "react-spinners";
import CanvasLayer from "@/components/CanvasLayer";
import { IconHandGrab } from "@tabler/icons-react";

const LiveDrawingArea = ({
  liveArtwork,
  setLiveArtwork,
  liveLayers,
  setLiveLayers,
  isLoading,
  setIsLoading,
  setHasChanged,
}: {
  liveArtwork: Artwork;
  setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
  liveLayers: Layer[];
  setLiveLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // States
  const [startMoving, setStartMoving] = useState<boolean>(false);
  const [startDrawing, setStartDrawing] = useState<boolean>(false);
  const [startingMousePosition, setStartingMousePosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [startingSnapshot, setStartingSnapshot] = useState<ImageData>(
    new ImageData(1, 1),
  );

  const [originalSelectedArea, setOriginalSelectedArea] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });

  const [allLayersStartingSnapshots, setAllLayersStartingSnapshots] = useState<
    ImageData[]
  >([]);

  const [pixelReference, setPixelReference] = useState<number>(1);
  const [dominantDimension, setDominantDimension] = useState<string>("width");

  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [doubleClickTime, setDoubleClickTime] = useState<number>(0);
  const [mouseInCanvas, setMouseInCanvas] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const [Touches] = useState({
    OneFinger: 1,
    TwoFingers: 2,
    ThreeFingers: 3,
    FourFingers: 4,
  });

  // Zustands
  const {
    canvasSize,
    canvasBackground,
    selectedLayer,
    selectedFrame,
    selectedTool,
    previousTool,
    selectedColour,
    setSelectedColour,
    selectedArea,
    moveAllLayers,
    setSelectedArea,
    currentAlpha,
    setCurrentAlpha,
    setSelectedTool,
    setPreviousTool,
    setMoveAllLayers,
  } = useArtStore();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const floaterRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);
  const canvasRefs = useRef<RefObject<HTMLCanvasElement>[]>([]);
  const evCacheRefs = useRef<React.PointerEvent<HTMLDivElement>[]>([]);

  // Functions
  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    setCanvasZoom((prevZoom) => {
      const newZoom = prevZoom + event.deltaY / 1000;
      return Math.min(Math.max(newZoom, 0.25), 3);
    });
  };

  const handleResize = () => {
    if (windowRef.current && wrapperRef.current) {
      const windowWidth = windowRef.current.clientWidth;
      const windowHeight = windowRef.current.clientHeight;
      const canvasRatio = canvasSize.width / canvasSize.height;

      const widthConstrainedHeight = windowWidth / canvasRatio;
      const heightConstrainedWidth = windowHeight * canvasRatio;

      if (widthConstrainedHeight <= windowHeight * 0.9) {
        setDominantDimension("width");
      } else {
        setDominantDimension("height");
      }
    }
  };

  const toggleTools = () => {
    let prevTool = previousTool;
    let currentTool = selectedTool;

    [prevTool, currentTool] = [currentTool, prevTool];

    setSelectedTool(currentTool);
    setPreviousTool(prevTool);
  };

  const actionTool = async ({
    normalisedX,
    normalisedY,
  }: {
    normalisedX: number;
    normalisedY: number;
  }) => {
    const currentFrame = document.createElement("canvas");
    const currentContext = currentFrame?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!currentContext) return;
    const updatedArtwork = { ...liveArtwork };

    // clearSelection(hudRef.current, setSelectedArea);

    activateDrawingTool(
      selectedTool,
      selectedColour,
      currentAlpha,
      setCurrentAlpha,
      { x: 1, y: 1 },
      { x: normalisedX, y: normalisedY },
      startingMousePosition,
      updatedArtwork,
      selectedLayer,
      selectedFrame,
      currentFrame!,
      currentContext,
      setSelectedColour,
      selectedArea,
      setSelectedArea,
      canvasSize,
      startingSnapshot,
      hudRef.current,
      floaterRef.current,
      moveAllLayers,
      originalSelectedArea,
      allLayersStartingSnapshots,
    );

    setLiveArtwork(updatedArtwork);
    setLiveLayers(updatedArtwork.layers);

    if (DRAWING_TOOLS[selectedTool].doAfter) {
      toggleTools();
    }
    setHasChanged(true);
  };

  // Handle clicking outside canvas to clear selection
  const handleOutsideClick = (event: React.MouseEvent) => {
    // Check if click is outside the canvas wrapper
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target as Node)
    ) {
      clearSelection(hudRef.current, setSelectedArea);
    }
  };

  useEffect(() => {
    const backgroundCanvas = canvasBackgroundRef.current;
    if (backgroundCanvas) colourBackground(canvasBackground, backgroundCanvas);

    setIsLoading(true);
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    setTimeout(() => setIsLoading(false), 2000);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasBackground]);

  // Update resize when canvas size changes
  useEffect(() => {
    handleResize();
  }, [canvasSize]);

  // Render
  return (
    <>
      {startMoving ? (
        <IconHandGrab
          size={30}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      ) : (
        <CustomPointer
          currentTool={selectedTool}
          pixelReference={pixelReference}
          mouseInCanvas={mouseInCanvas}
          mousePosition={mousePosition}
        />
      )}

      {isLoading && (
        <section
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-content-center w-full h-full z-50`}
        >
          <PuffLoader
            size={50}
            color={canvasBackground === "white" ? "black" : "white"}
          />
        </section>
      )}

      <section
        ref={windowRef}
        className={`grid place-items-center w-full h-full transition-all duration-300`}
        style={{
          transition: `all 0.3s ease, opacity 1s ease-in-out`,
        }}
        onClick={handleOutsideClick}
        onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
          if (
            (event.pointerType === "mouse" &&
              event.button === MouseButtons.MiddleClick) ||
            (event.pointerType === "touch" &&
              evCacheRefs.current.length === Touches.FourFingers)
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
        <article
          ref={wrapperRef}
          className={`${mouseInCanvas ? "cursor-none" : ""} mx-auto relative ${
            dominantDimension === "width" ? "w-[90%]" : "h-[90%]"
          }`}
          style={{
            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
            transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom})`,
          }}
          onContextMenu={(event) => event.preventDefault()}
          onWheel={handleZoom}
          onClick={(e) => e.stopPropagation()} // Prevent clearing selection when clicking on canvas
          onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
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

            if (event.pointerType === "mouse") {
              if (event.button === MouseButtons.LeftClick) {
                if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                  setStartDrawing(true);
                  setStartingMousePosition({ x: normalisedX, y: normalisedY });

                  // Capture starting snapshot for selected layer
                  setStartingSnapshot(
                    liveArtwork.layers[selectedLayer].frames[
                      selectedFrame + 1
                    ] || new ImageData(1, 1),
                  );

                  // For move tool, capture additional data
                  if (
                    DRAWING_TOOLS[selectedTool].name.toLowerCase() === "move"
                  ) {
                    // Capture original selection area
                    setOriginalSelectedArea({
                      start: {
                        x: selectedArea.start.x,
                        y: selectedArea.start.y,
                      },
                      end: { x: selectedArea.end.x, y: selectedArea.end.y },
                    });

                    // If moving all layers, capture all layer snapshots
                    if (moveAllLayers) {
                      const snapshots: ImageData[] = [];
                      liveArtwork.layers.forEach((layer, index) => {
                        const frameData = layer.frames[selectedFrame + 1];
                        snapshots[index] =
                          frameData ||
                          new ImageData(canvasSize.width, canvasSize.height);
                      });
                      setAllLayersStartingSnapshots(snapshots);
                    }
                  }

                  requestAnimationFrame(async () => {
                    await actionTool({ normalisedX, normalisedY });
                  });
                }
              } else if (event.button === MouseButtons.MiddleClick) {
                setStartMoving(true);
              }
            } else if (event.pointerType === "touch") {
              evCacheRefs.current.push(event);
              if (evCacheRefs.current.length === 1) {
                if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                  setStartDrawing(true);
                  setStartingMousePosition({ x: normalisedX, y: normalisedY });

                  setStartingSnapshot(
                    liveArtwork.layers[selectedLayer].frames[
                      selectedFrame + 1
                    ] || new ImageData(1, 1),
                  );

                  // For move tool, capture additional data
                  if (
                    DRAWING_TOOLS[selectedTool].name.toLowerCase() === "move"
                  ) {
                    setOriginalSelectedArea({
                      start: {
                        x: selectedArea.start.x,
                        y: selectedArea.start.y,
                      },
                      end: { x: selectedArea.end.x, y: selectedArea.end.y },
                    });

                    if (moveAllLayers) {
                      const snapshots: ImageData[] = [];
                      liveArtwork.layers.forEach((layer, index) => {
                        const frameData = layer.frames[selectedFrame + 1];
                        snapshots[index] =
                          frameData ||
                          new ImageData(canvasSize.width, canvasSize.height);
                      });
                      setAllLayersStartingSnapshots(snapshots);
                    }
                  }

                  requestAnimationFrame(async () => {
                    await actionTool({ normalisedX, normalisedY });
                  });
                }
              } else if (evCacheRefs.current.length === Touches.TwoFingers) {
                setStartMoving(true);
              } else if (evCacheRefs.current.length === Touches.FourFingers) {
                setStartMoving(true);
              }
            } else if (event.pointerType === "pen") {
              if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                setStartDrawing(true);
                setStartingMousePosition({ x: normalisedX, y: normalisedY });

                setStartingSnapshot(
                  liveArtwork.layers[selectedLayer].frames[selectedFrame + 1] ||
                    new ImageData(1, 1),
                );

                // For move tool, capture additional data
                if (DRAWING_TOOLS[selectedTool].name.toLowerCase() === "move") {
                  setOriginalSelectedArea({
                    start: { x: selectedArea.start.x, y: selectedArea.start.y },
                    end: { x: selectedArea.end.x, y: selectedArea.end.y },
                  });

                  if (moveAllLayers) {
                    const snapshots: ImageData[] = [];
                    liveArtwork.layers.forEach((layer, index) => {
                      const frameData = layer.frames[selectedFrame + 1];
                      snapshots[index] =
                        frameData ||
                        new ImageData(canvasSize.width, canvasSize.height);
                    });
                    setAllLayersStartingSnapshots(snapshots);
                  }
                }

                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
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
              if (event.button === MouseButtons.LeftClick) {
                if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                  requestAnimationFrame(async () => {
                    await actionTool({ normalisedX, normalisedY });
                  });
                }
              } else if (event.button === MouseButtons.RightClick) {
                toggleTools();
              }
            } else if (event.pointerType === "touch") {
              if (evCacheRefs.current.length === Touches.OneFinger) {
                if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                  requestAnimationFrame(async () => {
                    await actionTool({ normalisedX, normalisedY });
                  });
                }
              } else if (evCacheRefs.current.length === Touches.ThreeFingers) {
                // TODO: Undo last action
              } else if (evCacheRefs.current.length === Touches.FourFingers) {
                // TODO: Redo last action
              }

              // Clear touch cache
              evCacheRefs.current = evCacheRefs.current.filter(
                (cached) => cached.pointerId !== event.pointerId,
              );
            } else if (event.pointerType === "pen") {
              if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
            }

            setStartDrawing(false);
            setStartMoving(false);
          }}
          onPointerMove={async (event: React.PointerEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement;
            const getRect = target.getBoundingClientRect();
            const { clientX, clientY } = event;
            const { x, y, width, height } = getRect;

            setMousePosition({ x: clientX, y: clientY });
            setPixelReference(width / canvasSize.width);
            setMouseInCanvas(true);

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
              requestAnimationFrame(async () => {
                await actionTool({ normalisedX, normalisedY });
              });
            } else if (startMoving) {
              setCanvasPosition((prevPosition) => ({
                x: prevPosition.x + event.movementX,
                y: prevPosition.y + event.movementY,
              }));
            } else {
              setStartingMousePosition({ x: normalisedX, y: normalisedY });
            }
          }}
          onPointerEnter={() => setMouseInCanvas(true)}
          onPointerOut={() => {
            setMouseInCanvas(false);
            setStartDrawing(false);
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
            width={canvasSize.width}
            height={canvasSize.height}
          ></canvas>

          {liveLayers.map((layer, index) => (
            <CanvasLayer
              key={`live-drawing-area-layer-${index}`}
              className={layer.visible ? "block" : "hidden"}
              canvasSize={canvasSize}
              frame={layer.frames[selectedFrame + 1]}
              opacity={layer.opacity}
              blendMode={layer.blendMode}
            />
          ))}

          <canvas
            ref={floaterRef}
            className={`pointer-events-none absolute top-0 left-0 w-full h-full z-20`}
            style={{
              imageRendering: "pixelated",
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          ></canvas>

          <canvas
            ref={hudRef}
            className={`pointer-events-none absolute top-0 left-0 w-full h-full z-40`}
            style={{
              imageRendering: "pixelated",
            }}
            width={24 * canvasSize.width}
            height={24 * canvasSize.height}
          ></canvas>
        </article>
      </section>
    </>
  );
};

export default LiveDrawingArea;
