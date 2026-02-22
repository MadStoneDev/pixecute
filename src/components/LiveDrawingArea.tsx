// components/LiveDrawingArea.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

import useArtStore from "@/utils/Zustand";
import { getToolById } from "@/data/DefaultTools";
import { currentMousePosition } from "@/utils/Mouse";
import { CustomPointer, CustomPointerHandle } from "@/data/CustomPointer";
import {
  activateDrawingTool,
  clearSelection,
  bresenhamLine,
  DrawContext,
} from "@/utils/Drawing";
import { colourBackground } from "@/utils/CanvasLayers";
import { hexToRgb } from "@/utils/Colour";

import { PuffLoader } from "react-spinners";
import { IconHandGrab } from "@tabler/icons-react";
import { ToolId } from "@/types/canvas";

const LiveDrawingArea = ({
  isLoading,
  setIsLoading,
}: {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // Drawing state tracked via refs for imperative pipeline (no re-renders during strokes)
  const isDrawingRef = useRef(false);
  const isMovingRef = useRef(false);
  const startMousePosRef = useRef({ x: 0, y: 0 });
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const startingSnapshotRef = useRef<ImageData>(new ImageData(1, 1));
  const originalSelectedAreaRef = useRef({
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
  });
  const allLayersSnapshotsRef = useRef<ImageData[]>([]);
  const cachedRgbRef = useRef<{ r: number; g: number; b: number } | null>(null);

  // UI state (ok to re-render for these)
  const [dominantDimension, setDominantDimension] = useState<string>("width");
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [doubleClickTime, setDoubleClickTime] = useState<number>(0);
  const [mouseInCanvas, setMouseInCanvas] = useState<boolean>(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [startMoving, setStartMoving] = useState(false);
  const showGrid = useArtStore((s) => s.showGrid);
  const customPointerRef = useRef<CustomPointerHandle>(null);
  const handGrabRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand - granular selectors
  const canvasSize = useArtStore((s) => s.canvasSize);
  const canvasBackground = useArtStore((s) => s.canvasBackground);
  const selectedLayer = useArtStore((s) => s.selectedLayer);
  const selectedFrame = useArtStore((s) => s.selectedFrame);
  const selectedTool = useArtStore((s) => s.selectedTool);
  const previousTool = useArtStore((s) => s.previousTool);
  const selectedColour = useArtStore((s) => s.selectedColour);
  const setSelectedColour = useArtStore((s) => s.setSelectedColour);
  const selectedArea = useArtStore((s) => s.selectedArea);
  const moveAllLayers = useArtStore((s) => s.moveAllLayers);
  const setSelectedArea = useArtStore((s) => s.setSelectedArea);
  const currentAlpha = useArtStore((s) => s.currentAlpha);
  const setCurrentAlpha = useArtStore((s) => s.setCurrentAlpha);
  const setSelectedTool = useArtStore((s) => s.setSelectedTool);
  const setPreviousTool = useArtStore((s) => s.setPreviousTool);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const setHasChanged = useArtStore((s) => s.setHasChanged);
  const onionSkinning = useArtStore((s) => s.onionSkinning);

  // Derive layers from artwork
  const liveLayers = liveArtwork?.layers ?? [];

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const floaterRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  // Reusable temp canvas ref (avoid creating new ones each render)
  const tempCanvasRef = useRef<HTMLCanvasElement>(
    typeof document !== "undefined"
      ? document.createElement("canvas")
      : (null as any),
  );

  const evCacheRefs = useRef<React.PointerEvent<HTMLDivElement>[]>([]);

  // Functions
  const renderLayers = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tempCanvas = tempCanvasRef.current;
    if (!tempCanvas) return;
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.imageSmoothingEnabled = false;

    liveLayers.forEach((layer) => {
      if (layer.visible && layer.frames[selectedFrame]) {
        const imageData = layer.frames[selectedFrame];
        if (imageData) {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.putImageData(imageData, 0, 0);

          ctx.globalAlpha = layer.opacity || 1;
          ctx.globalCompositeOperation = layer.blendMode || "source-over";
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, [liveLayers, selectedFrame, canvasSize]);

  // Onion skinning: render previous/next frames as semi-transparent overlays
  const renderOnionSkin = useCallback(() => {
    const floater = floaterRef.current;
    if (!floater) return;

    const ctx = floater.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, floater.width, floater.height);
    if (!onionSkinning || liveArtwork.frames.length <= 1) return;

    const tempCanvas = tempCanvasRef.current;
    if (!tempCanvas) return;
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.imageSmoothingEnabled = false;

    const renderGhostFrame = (
      frameIndex: number,
      tintR: number,
      tintG: number,
      tintB: number,
      opacity: number,
    ) => {
      if (frameIndex < 0 || frameIndex >= liveArtwork.frames.length) return;

      // Composite all visible layers for this frame
      tempCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      liveLayers.forEach((layer) => {
        if (layer.visible && layer.frames[frameIndex]) {
          const imageData = layer.frames[frameIndex];
          if (imageData) {
            // Create a tinted version
            const tinted = new ImageData(
              new Uint8ClampedArray(imageData.data),
              imageData.width,
              imageData.height,
            );
            const data = tinted.data;
            for (let i = 0; i < data.length; i += 4) {
              // Blend towards tint colour
              data[i] = Math.round(data[i] * 0.5 + tintR * 0.5);
              data[i + 1] = Math.round(data[i + 1] * 0.5 + tintG * 0.5);
              data[i + 2] = Math.round(data[i + 2] * 0.5 + tintB * 0.5);
            }
            tempCtx.putImageData(tinted, 0, 0);
          }
        }
      });

      ctx.globalAlpha = opacity;
      ctx.drawImage(tempCanvas, 0, 0);
    };

    // Previous frame in red tint
    renderGhostFrame(selectedFrame - 1, 255, 100, 100, 0.25);
    // Next frame in blue tint
    renderGhostFrame(selectedFrame + 1, 100, 100, 255, 0.25);

    ctx.globalAlpha = 1;
  }, [onionSkinning, selectedFrame, liveLayers, canvasSize, liveArtwork.frames.length]);

  useEffect(() => {
    renderOnionSkin();
  }, [renderOnionSkin]);

  // Grid rendering
  const renderGrid = useCallback(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    if (!showGrid) return;

    // Only show grid when zoomed in enough (pixel cells >= 4px on screen)
    const wrapperEl = wrapperRef.current;
    if (!wrapperEl) return;
    const pixelSize = wrapperEl.clientWidth / canvasSize.width;
    if (pixelSize * canvasZoom < 4) return;

    const w = gridCanvas.width;
    const h = gridCanvas.height;
    const cellW = w / canvasSize.width;
    const cellH = h / canvasSize.height;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 1; x < canvasSize.width; x++) {
      const px = Math.round(x * cellW) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
    }
    for (let y = 1; y < canvasSize.height; y++) {
      const py = Math.round(y * cellH) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }

    ctx.stroke();
  }, [showGrid, canvasSize, canvasZoom]);

  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    setCanvasZoom((prevZoom) => {
      const zoomSpeed = event.ctrlKey ? 0.003 : 0.001;
      const newZoom = prevZoom - event.deltaY * zoomSpeed;
      return Math.min(Math.max(newZoom, 0.1), 64);
    });
  };

  const handleResize = useCallback(() => {
    if (windowRef.current && wrapperRef.current) {
      const windowWidth = windowRef.current.clientWidth;
      const windowHeight = windowRef.current.clientHeight;
      const canvasRatio = canvasSize.width / canvasSize.height;

      const widthConstrainedHeight = windowWidth / canvasRatio;

      if (widthConstrainedHeight <= windowHeight * 0.9) {
        setDominantDimension("width");
      } else {
        setDominantDimension("height");
      }
    }
  }, [canvasSize]);

  const toggleTools = useCallback(() => {
    const prevTool = previousTool;
    const currentTool = selectedTool;
    setSelectedTool(prevTool);
    setPreviousTool(currentTool);
  }, [previousTool, selectedTool, setSelectedTool, setPreviousTool]);

  // Imperative drawing: called directly from pointer events, no setState
  const executeDrawAtPosition = (normX: number, normY: number) => {
    // Get the current store state directly (avoid stale closures)
    const state = useArtStore.getState();
    const artwork = state.liveArtwork;

    const drawCtx: DrawContext = {
      artwork,
      layer: state.selectedLayer,
      frame: state.selectedFrame,
      position: { x: normX, y: normY },
      startPosition: startMousePosRef.current,
      colour: state.selectedColour,
      alpha: state.currentAlpha,
      canvasSize: state.canvasSize,
      setSelectedColour: state.setSelectedColour,
      setCurrentAlpha: state.setCurrentAlpha,
      setSelectedArea: state.setSelectedArea,
      hudCanvas: hudRef.current,
      startingSnapshot: startingSnapshotRef.current,
      moveAllLayers: state.moveAllLayers,
      originalSelectedArea: originalSelectedAreaRef.current,
      allLayersStartingSnapshots: allLayersSnapshotsRef.current,
      cachedRgb: cachedRgbRef.current || undefined,
    };

    activateDrawingTool(drawCtx, state.selectedTool);

    // After drawing, update the store to trigger render
    setLiveArtwork({ ...artwork });
    setHasChanged(true);
  };

  const actionToolImperative = (normX: number, normY: number) => {
    const tool = getToolById(selectedTool);

    // Use Bresenham interpolation for pencil/eraser to prevent dotted lines
    if (selectedTool === "pencil" || selectedTool === "eraser") {
      const prev = prevMousePosRef.current;
      if (prev.x !== normX || prev.y !== normY) {
        const points = bresenhamLine(prev.x, prev.y, normX, normY);
        // Skip first point if it was already drawn (avoid double-drawing)
        const startIdx = points.length > 1 ? 1 : 0;
        for (let i = startIdx; i < points.length; i++) {
          executeDrawAtPosition(points[i].x, points[i].y);
        }
      } else {
        executeDrawAtPosition(normX, normY);
      }
    } else {
      executeDrawAtPosition(normX, normY);
    }

    prevMousePosRef.current = { x: normX, y: normY };

    if (tool?.doAfter) {
      toggleTools();
    }
  };

  // Handle clicking outside canvas to clear selection
  const handleOutsideClick = (event: React.MouseEvent) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target as Node)
    ) {
      clearSelection(hudRef.current, setSelectedArea);
    }
  };

  const getNormalisedPosition = (
    clientX: number,
    clientY: number,
    target: HTMLElement,
  ) => {
    const getRect = target.getBoundingClientRect();
    return currentMousePosition(
      clientX,
      clientY,
      canvasSize,
      getRect.x,
      getRect.y,
      getRect.width,
      getRect.height,
    );
  };

  // --- Unified Pointer Handlers ---
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const { clientX, clientY } = event;

    mousePositionRef.current = { x: clientX, y: clientY };
    customPointerRef.current?.updatePosition(clientX, clientY);
    if (handGrabRef.current) {
      handGrabRef.current.style.left = clientX + "px";
      handGrabRef.current.style.top = clientY + "px";
    }

    const { normalisedX, normalisedY } = getNormalisedPosition(
      clientX,
      clientY,
      target,
    );

    const isLeftClick =
      event.pointerType === "mouse" && event.button === 0;
    const isMiddleClick =
      event.pointerType === "mouse" && event.button === 1;
    const isSingleTouch =
      event.pointerType === "touch" && evCacheRefs.current.length === 0;
    const isPen = event.pointerType === "pen";

    if (event.pointerType === "touch") {
      evCacheRefs.current.push(event);
    }

    // Multi-touch pan
    if (
      event.pointerType === "touch" &&
      evCacheRefs.current.length >= 2
    ) {
      isMovingRef.current = true;
      setStartMoving(true);
      return;
    }

    if (isMiddleClick) {
      isMovingRef.current = true;
      setStartMoving(true);
      return;
    }

    if (isLeftClick || isSingleTouch || isPen) {
      const tool = getToolById(selectedTool);
      if (tool?.trigger === "down") {
        // Push history snapshot before drawing starts
        useArtStore.getState().pushToHistory(`Draw with ${selectedTool}`);

        // Set pointer capture for continuous drawing outside canvas
        (event.target as HTMLElement).setPointerCapture(event.pointerId);

        isDrawingRef.current = true;
        startMousePosRef.current = { x: normalisedX, y: normalisedY };
        prevMousePosRef.current = { x: normalisedX, y: normalisedY };

        // Cache RGB colour once per stroke
        cachedRgbRef.current = hexToRgb(selectedColour);

        // Capture starting snapshot
        const frameData =
          liveArtwork.layers[selectedLayer]?.frames[selectedFrame];
        startingSnapshotRef.current =
          frameData ||
          new ImageData(canvasSize.width, canvasSize.height);

        // For move tool: capture additional data
        if (selectedTool === "move") {
          originalSelectedAreaRef.current = {
            start: { x: selectedArea.start.x, y: selectedArea.start.y },
            end: { x: selectedArea.end.x, y: selectedArea.end.y },
          };

          if (moveAllLayers) {
            const snapshots: ImageData[] = [];
            liveArtwork.layers.forEach((layer, index) => {
              const fd = layer.frames[selectedFrame];
              snapshots[index] =
                fd || new ImageData(canvasSize.width, canvasSize.height);
            });
            allLayersSnapshotsRef.current = snapshots;
          }
        }

        // Draw synchronously (no rAF wrapper)
        executeDrawAtPosition(normalisedX, normalisedY);
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const { clientX, clientY } = event;

    const { normalisedX, normalisedY } = getNormalisedPosition(
      clientX,
      clientY,
      target,
    );

    const isLeftClick =
      event.pointerType === "mouse" && event.button === 0;
    const isRightClick =
      event.pointerType === "mouse" && event.button === 2;
    const isSingleTouch =
      event.pointerType === "touch" &&
      evCacheRefs.current.length === 1;
    const isPen = event.pointerType === "pen";
    const isMiddleClick =
      event.pointerType === "mouse" && event.button === 1;

    if (isMiddleClick || (event.pointerType === "touch" && evCacheRefs.current.length >= 4)) {
      isMovingRef.current = false;
      setStartMoving(false);

      const timeNow = Date.now();
      const DOUBLE_CLICK_DELAY = 500;
      if (timeNow - doubleClickTime < DOUBLE_CLICK_DELAY) {
        setCanvasZoom(1);
        setCanvasPosition({ x: 0, y: 0 });
        setDoubleClickTime(0);
      } else {
        setDoubleClickTime(timeNow);
      }
    }

    if (isLeftClick || isSingleTouch || isPen) {
      const tool = getToolById(selectedTool);
      if (tool?.trigger === "up") {
        // Push history before trigger-up tool action
        if (selectedTool !== "picker") {
          useArtStore.getState().pushToHistory(`Use ${selectedTool}`);
        }
        // Cache RGB for trigger-up tools
        cachedRgbRef.current = hexToRgb(selectedColour);
        executeDrawAtPosition(normalisedX, normalisedY);
        if (tool.doAfter) {
          toggleTools();
        }
      }
    }

    if (isRightClick) {
      toggleTools();
    }

    // Clear touch cache
    if (event.pointerType === "touch") {
      evCacheRefs.current = evCacheRefs.current.filter(
        (cached) => cached.pointerId !== event.pointerId,
      );
    }

    isDrawingRef.current = false;
    isMovingRef.current = false;
    setStartMoving(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const { clientX, clientY } = event;

    // Update pointer position via DOM (no React re-render)
    mousePositionRef.current = { x: clientX, y: clientY };
    customPointerRef.current?.updatePosition(clientX, clientY);
    if (handGrabRef.current) {
      handGrabRef.current.style.left = clientX + "px";
      handGrabRef.current.style.top = clientY + "px";
    }

    const { normalisedX, normalisedY } = getNormalisedPosition(
      clientX,
      clientY,
      target,
    );

    if (isDrawingRef.current) {
      actionToolImperative(normalisedX, normalisedY);
    } else if (isMovingRef.current) {
      setCanvasPosition((prev) => ({
        x: prev.x + event.movementX,
        y: prev.y + event.movementY,
      }));
    } else {
      startMousePosRef.current = { x: normalisedX, y: normalisedY };
      prevMousePosRef.current = { x: normalisedX, y: normalisedY };
    }
  };

  useEffect(() => {
    const backgroundCanvas = canvasBackgroundRef.current;
    if (backgroundCanvas) colourBackground(canvasBackground, backgroundCanvas);

    setIsLoading(true);
    handleResize();

    window.addEventListener("resize", handleResize);

    const timeoutId = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [canvasBackground, handleResize, setIsLoading]);

  useEffect(() => {
    handleResize();
  }, [canvasSize, handleResize]);

  useEffect(() => {
    renderLayers();
  }, [liveArtwork, selectedFrame, canvasSize, canvasBackground, renderLayers]);

  // Render
  return (
    <>
      <div
        ref={handGrabRef}
        className={`pointer-events-none fixed z-50 ${
          startMoving && mouseInCanvas ? "block" : "hidden"
        }`}
        style={{
          transform: `translate(-50%, -50%)`,
          willChange: "left, top",
        }}
      >
        <IconHandGrab size={30} className="text-neutral-100" />
      </div>
      <CustomPointer
        ref={customPointerRef}
        currentTool={selectedTool}
      />

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
            (event.pointerType === "mouse" && event.button === 1) ||
            (event.pointerType === "touch" &&
              evCacheRefs.current.length === 4)
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
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerEnter={() => {
            setMouseInCanvas(true);
            if (!startMoving) customPointerRef.current?.setVisible(true);
          }}
          onPointerOut={() => {
            setMouseInCanvas(false);
            customPointerRef.current?.setVisible(false);
            // Don't stop drawing on pointer out - pointer capture handles this
          }}
        >
          {/* Background Layer */}
          <canvas
            ref={canvasBackgroundRef}
            className={`absolute top-0 left-0 w-full h-full ${
              canvasBackground === "transparent" ? "opacity-75" : ""
            }`}
            style={{
              imageRendering: "pixelated",
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          ></canvas>

          <canvas
            ref={mainCanvasRef}
            className="absolute top-0 left-0 w-full h-full z-10"
            style={{
              imageRendering: "pixelated",
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          />

          <canvas
            ref={floaterRef}
            className={`pointer-events-none absolute top-0 left-0 w-full h-full z-20`}
            style={{
              imageRendering: "pixelated",
            }}
            width={canvasSize.width}
            height={canvasSize.height}
          ></canvas>

          {/* Grid overlay canvas */}
          <canvas
            ref={gridCanvasRef}
            className={`pointer-events-none absolute top-0 left-0 w-full h-full z-30`}
            width={canvasSize.width * 24}
            height={canvasSize.height * 24}
          />

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
