﻿"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  RefObject,
  createRef,
} from "react";

import { ColourObject, Layer } from "@/types/canvas";
import CanvasLayer from "@/components/CanvasLayer";
import { hexToHsl } from "@/utilities/ColourUtils";

import {
  IconColorPicker,
  IconEraser,
  IconLayersSubtract,
  IconMovie,
  IconPaintFilled,
  IconPencil,
} from "@tabler/icons-react";

import {
  drawPixel,
  drawTransparentGrid,
  erasePixel,
  fillCanvas,
  fillPixel,
  pickerPixel,
  saveImageToSession,
  updatePreviewWindow,
} from "@/utilities/ArtToolsUtils";
import { imageDataToDataURL } from "@/utilities/LayerUtils";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface ArtTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  subTools?: ArtTool[];
}

interface CanvasEditorProps {
  setColour?: (colour: string, alpha: number) => void;
  currentColour?: ColourObject;
  currentTool?: ArtTool;
  config?: CanvasConfig;
}

const CanvasContainer = ({
  setColour = () => {},
  currentColour = { colour: "#000", alpha: 255 },
  currentTool = {
    name: "Pencil",
    icon: <IconPencil size={24} />,
    trigger: "down",
  },
  config = { width: 32, height: 16, background: "transparent" },
}: CanvasEditorProps) => {
  // States
  const [loading, setLoading] = useState(true);
  const [lastClick, setLastClick] = useState(0);
  const [mouseInCanvas, setMouseInCanvas] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [pixelSize, setPixelSize] = useState({ x: 0, y: 0 });

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  const [activeFrame, setActiveFrame] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [layers, setLayers] = useState<Layer[]>([
    {
      name: "Layer 1",
      opacity: 1,
      visible: true,
      frames: {
        1: null,
      },
    },
  ]);

  // Refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Layer-Related Refs
  const layerRefs = useRef<RefObject<HTMLCanvasElement>[]>([
    createRef<HTMLCanvasElement>(),
  ]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const transparentBackgroundRef = useRef<HTMLCanvasElement>(null);

  const activateTool = useCallback(
    (x: number, y: number) => {
      const currentLayer = layerRefs.current[activeLayer].current;
      const currentContext = currentLayer?.getContext("2d");

      if (!currentLayer || !currentContext) return;

      switch (currentTool.name) {
        case "Pencil":
          return drawPixel(
            x,
            y,
            pixelSize,
            currentColour,
            currentLayer,
            currentContext,
          );
        case "Picker":
          const { colour, alpha } = pickerPixel(
            x,
            y,
            pixelSize,
            currentContext,
          );

          setColour(colour, alpha);
          return true;
        case "Eraser":
          return erasePixel(x, y, pixelSize, currentLayer, currentContext);
        case "Fill":
          return fillPixel(
            x,
            y,
            pixelSize,
            config.width,
            config.height,
            currentColour,
            currentLayer,
            currentContext,
          );
        default:
          return drawPixel(
            x,
            y,
            pixelSize,
            currentColour,
            currentLayer,
            currentContext,
          );
      }
    },
    [
      currentTool,
      currentColour,
      pixelSize,
      config.width,
      config.height,
      setColour,
    ],
  );

  const getToolIcon = useCallback(() => {
    const toolProps = {
      size: 26,
      className: `stroke-[1.35px] ${
        hexToHsl(currentColour.colour as string).l >= 50
          ? "text-neutral-800"
          : "text-neutral-100"
      }`,
      style: {
        fill: currentColour.colour as string,
        transform: "translate(-15%, -80%)",
      },
    };

    switch (currentTool.name) {
      case "Pencil":
        return (
          <IconPencil
            size={26}
            className={`stroke-[1.35px] ${
              hexToHsl(currentColour.colour as string).l >= 50
                ? "text-neutral-800"
                : "text-neutral-100"
            }`}
            style={{
              fill: currentColour.colour as string,
              transform: "translate(-15%, -80%)",
            }}
          />
        );
      case "Picker":
        return (
          <div className={`relative`}>
            <div
              className={`absolute -top-1 right-1 w-2.5 h-2.5 rounded-full border-[2px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "border-neutral-800"
                  : "border-neutral-100"
              }`}
              style={{
                backgroundColor: currentColour.colour as string,
              }}
            ></div>
            <IconColorPicker
              size={26}
              className={`stroke-[1.35px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "text-neutral-800"
                  : "text-neutral-100"
              }`}
              style={{
                transform: "translate(-15%, -80%)",
              }}
            />
          </div>
        );
      case "Eraser":
        return (
          <IconEraser
            size={26}
            className={`stroke-[1.35px] ${
              hexToHsl(currentColour.colour as string).l >= 50
                ? "text-neutral-800"
                : "text-neutral-100"
            }`}
            style={{
              fill: "white",
              transform: "translate(-40%, -80%)",
            }}
          />
        );
      case "Fill":
        return (
          <div className={`relative flex flex-col items-center`}>
            <div
              className={`absolute top-0 left-0 w-2 h-2 border-neutral-900`}
              style={{
                backgroundColor: currentColour.colour as string,
                clipPath: "polygon(0 0, 100% 100%, 100% 0%)",
                transform: "translate(0%, -100%) rotateZ(180deg)",
              }}
            ></div>
            <IconPaintFilled
              size={26}
              className={`stroke-[1.35px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "text-neutral-800"
                  : "text-neutral-100"
              } `}
              style={{
                fill: currentColour.colour as string,
                transform: "translate(0%, -100%)",
              }}
            />
          </div>
        );
      default:
        return <IconPencil {...toolProps} />;
    }
  }, []);

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent,
  ) => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event instanceof MouseEvent) {
      return {
        x: Math.floor((event.clientX - rect.left) * scaleX),
        y: Math.floor((event.clientY - rect.top) * scaleY),
      };
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return {
        x: Math.floor((touch.clientX - rect.left) / pixelSize.x),
        y: Math.floor((touch.clientY - rect.top) / pixelSize.y),
      };
    }

    return { x: 0, y: 0 };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    event.preventDefault();

    if (event.button === 0) {
      setIsDrawing(true);
      activateTool(x, y);

      // Update Preview Window
      const previewContext = previewCanvasRef.current!.getContext("2d", {
        willReadFrequently: true,
      });
      updatePreviewWindow(
        layerRefs.current[activeLayer]?.current!,
        previewContext!,
      );
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    setZoomCenter({ x: event.clientX, y: event.clientY });
    setCanvasZoom((prevScale) =>
      Math.max(0.1, prevScale - event.deltaY * 0.001),
    );
  };

  const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    if (isDrawing) activateTool(x, y);

    // Update Preview Window
    const previewContext = previewCanvasRef.current!.getContext("2d", {
      willReadFrequently: true,
    });
    updatePreviewWindow(
      layerRefs.current[activeLayer]?.current!,
      previewContext!,
    );
  };

  const touchDraw = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    if (isDrawing) activateTool(x, y);

    // Update Preview Window
    const previewContext = previewCanvasRef.current!.getContext("2d", {
      willReadFrequently: true,
    });
    updatePreviewWindow(
      layerRefs.current[activeLayer]?.current!,
      previewContext!,
    );
  };

  // RESIZE
  const handleResize = useCallback(() => {
    setCanvasZoom(1);

    const wrapper: HTMLDivElement = wrapperRef.current!;
    if (!wrapper) return;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const wrapperRatio = wrapperWidth / wrapperHeight;
    const artworkRatio = config.width / config.height;

    let scaledPixel = 0;
    let prelimCanvasWidth = 0;
    let prelimCanvasHeight = 0;

    if (wrapperRatio <= artworkRatio) {
      prelimCanvasWidth = Math.floor(wrapperWidth);
      scaledPixel = Math.floor(prelimCanvasWidth / config.width);
    } else {
      prelimCanvasHeight = Math.floor(wrapperHeight);
      scaledPixel = Math.floor(prelimCanvasHeight / config.height);
    }

    layerRefs.current.forEach((layer, index) => {
      const canvas: HTMLCanvasElement = layer.current!;
      if (!canvas) return;

      canvas.width = config.width;
      canvas.height = config.height;
      canvas.style.width = `${scaledPixel * config.width}px`;
      canvas.style.height = `${scaledPixel * config.height}px`;

      // Redraw Image
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (context) {
        context.imageSmoothingEnabled = false;

        const layer = layers[index];
        const frameData = layer.frames[activeFrame];

        if (frameData) {
          context.putImageData(frameData, 0, 0);
        }
      }
    });

    if (config.background === "transparent") {
      const transparentBackground: HTMLCanvasElement =
        transparentBackgroundRef.current!;
      transparentBackground.width = config.width;
      transparentBackground.height = config.height;
      transparentBackground.style.width = `${scaledPixel * config.width}px`;
      transparentBackground.style.height = `${scaledPixel * config.height}px`;

      drawTransparentGrid(transparentBackground, config.width, config.height);
    }

    const backgroundCanvas: HTMLCanvasElement = backgroundRef.current!;
    backgroundCanvas.width = config.width;
    backgroundCanvas.height = config.height;
    backgroundCanvas.style.width = `${scaledPixel * config.width}px`;
    backgroundCanvas.style.height = `${scaledPixel * config.height}px`;

    fillCanvas(backgroundCanvas, config.background as string);

    // Set Pixel Size - default to square for now
    setPixelSize({ x: 1, y: 1 });

    setLoading(false);
  }, [config.width, config.height, config.background]);

  useEffect(() => {
    saveImageToSession("");
    const canvas = layerRefs.current[activeLayer].current!;

    if (!canvas) return;
    handleResize();
  }, []);

  return (
    <section className={`flex-grow flex flex-col h-full`}>
      <article
        className={`relative flex-grow py-10 bg-neutral-200/70 dark:bg-neutral-900/70`}
      >
        <div
          ref={wrapperRef}
          className={`mx-auto w-full h-full z-10`}
          style={{
            transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`,
            transform: ` scale(${canvasZoom})`,
          }}
        >
          <section
            className={`mx-auto relative top-1/2 -translate-y-1/2 w-fit h-fit border-2 border-neutral-900 ${
              loading ? "opacity-0" : "opacity-100"
            } transition-all duration-300`}
            onMouseEnter={() => setMouseInCanvas(true)}
            onMouseDown={(event: React.MouseEvent<HTMLCanvasElement>) => {
              if (currentTool.trigger === "down") startDrawing(event);
            }}
            onMouseUp={(event: React.MouseEvent<HTMLCanvasElement>) => {
              if (event.button === 0) {
                if (currentTool.trigger === "up") startDrawing(event);
              } else if (event.button === 1) {
                const now = Date.now();

                if (now - lastClick < 500) {
                  handleResize();
                } else setLastClick(now);
              }

              finishDrawing();
            }}
            onWheel={handleWheel}
            onMouseLeave={() => {
              finishDrawing();
              setMouseInCanvas(false);
            }}
            onMouseMove={(event: React.MouseEvent<HTMLCanvasElement>) => {
              let { clientX, clientY } = event.nativeEvent;
              const rect = wrapperRef.current!.getBoundingClientRect();

              if (cursorRef.current) {
                cursorRef.current!.style.left = clientX + "px";
                cursorRef.current!.style.top = clientY + "px";
              }

              mouseDraw(event);
            }}
            onContextMenu={(event) => event.preventDefault()}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={finishDrawing}
            onTouchMove={touchDraw}
          >
            {/* Transparent Grid */}
            {config.background === "transparent" && (
              <canvas
                ref={transparentBackgroundRef}
                className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full z-0`}
                style={{
                  aspectRatio: config.width / config.height,
                  imageRendering: "pixelated",
                }}
              ></canvas>
            )}

            {/* Background Canvas */}
            <canvas
              ref={backgroundRef}
              className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full bg-${config?.background} z-0`}
              style={{
                aspectRatio: config.width / config.height,
                imageRendering: "pixelated",
              }}
            ></canvas>

            {layerRefs.current.map((layerRef, index) => (
              <CanvasLayer key={index} ref={layerRef} config={config} />
            ))}
          </section>
        </div>

        {/* Preview Window */}
        <canvas
          ref={previewCanvasRef}
          className={`absolute bottom-4 right-4 w-16 border-2 border-neutral-900`}
          style={{
            aspectRatio: config?.width / config?.height,
            imageRendering: "pixelated",
          }}
          width={config?.width}
          height={config?.height}
        ></canvas>
      </article>

      <article
        className={`p-5 w-full min-h-[220px] max-h-[250px] bg-white dark:bg-neutral-900 z-20`}
      >
        <section className={`flex gap-2 `}>
          <IconLayersSubtract /> <IconMovie /> Coming Soon
        </section>

        <section className={`flex gap-2 `}></section>
      </article>

      <div
        ref={cursorRef}
        className={`pointer-events-none absolute ${
          mouseInCanvas ? "block" : "hidden"
        } z-50`}
      >
        {getToolIcon()}
      </div>
    </section>
  );
};

export default CanvasContainer;
