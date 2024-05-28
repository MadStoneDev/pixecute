"use client";

import React, { useEffect, useRef, useState } from "react";
import CreateGrid from "@/utilities/CreateGrid";
import { IconEraser, IconPencil, TablerIcon } from "@tabler/icons-react";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface CanvasEditorProps {
  config?: CanvasConfig;
  colour?: string;
  tool?: { name: string; icon: React.ReactNode };
}

const CanvasLayer = ({
  config = { width: 32, height: 16, background: "transparent" },
  colour = "#000",
  tool = { name: "Pencil", icon: <IconPencil size={24} /> },
}: CanvasEditorProps) => {
  // States
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [pixelSize, setPixelSize] = useState(100);

  const [mouseInCanvas, setMouseInCanvas] = useState(false);

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [colourHistory, setColourHistory] = useState({});

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cursorRef = useRef<any>(null);

  const grid = CreateGrid(config.height, config.width);

  const activateTool = (x: number, y: number) => {
    switch (tool.name) {
      case "Pencil":
        return drawPixel(x, y);
      case "Eraser":
        return erasePixel(x, y);
      default:
        return drawPixel(x, y);
    }
  };

  const getToolIcon = () => {
    switch (tool.name) {
      case "Pencil":
        return (
          <IconPencil
            size={26}
            className={`stroke-[1.35px]`}
            style={{ fill: colour }}
          />
        );
      case "Eraser":
        return (
          <IconEraser
            size={26}
            className={`stroke-[1.35px]`}
            style={{ fill: "white" }}
          />
        );
      default:
        return (
          <IconPencil
            size={26}
            className={`stroke-[1.35px]`}
            style={{ fill: colour }}
          />
        );
    }
  };

  const saveImageToSession = (value: string) => {
    sessionStorage.setItem("currentImage", value);
  };

  const getImageFromSession = (key: string) => {
    return sessionStorage.getItem(key);
  };

  const handleResize = () => {
    const canvas: HTMLCanvasElement = canvasRef.current!;
    if (!canvas) return;

    const artworkRatio = config.width / config.height;
    const wrapperWidth = wrapperRef.current!.clientWidth;
    const wrapperHeight = wrapperRef.current!.clientHeight;
    const wrapperRatio = wrapperWidth / wrapperHeight;

    console.log(wrapperWidth, wrapperHeight);

    if (artworkRatio <= wrapperRatio) {
      canvas.style.height = `100%`;
      canvas.height = wrapperHeight;
      canvas.width = canvas.height * artworkRatio;
    } else {
      canvas.style.width = `100%`;
      canvas.width = wrapperWidth;
      canvas.height = canvas.width / artworkRatio;
    }

    // Set Pixel Size
    const pixelWidth = canvas.width / config.width;
    const pixelHeight = canvas.height / config.height;
    setPixelSize(Math.min(pixelWidth, pixelHeight));

    // // Redraw Image
    const canvasData = getImageFromSession("currentImage");
    const context = canvas.getContext("2d");

    if (context) contextRef.current = context;

    if (canvasData && context) {
      const img = new Image();
      img.src = canvasData;

      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  };

  useEffect(() => {
    saveImageToSession("");
    const canvas = canvasRef.current!;

    if (!canvas) return;

    window.addEventListener("resize", () => handleResize());
    handleResize();

    return () => window.removeEventListener("resize", () => handleResize());
  }, []);

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent,
  ) => {
    const rect = canvas.getBoundingClientRect();

    if (event instanceof MouseEvent) {
      return {
        x: Math.floor(
          (event.clientX - rect.left) / (rect.width / config.width),
        ),
        y: Math.floor(
          (event.clientY - rect.top) / (rect.height / config.height),
        ),
      };
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return {
        x: Math.floor(
          (touch.clientX - rect.left) / (rect.width / config.width),
        ),
        y: Math.floor(
          (touch.clientY - rect.top) / (rect.height / config.height),
        ),
      };
    }

    return { x: 0, y: 0 };
  };

  const drawPixel = (x: number, y: number) => {
    const context = contextRef.current!;

    context.fillStyle = colour;
    context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    // Update Canvas Data
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL();
    saveImageToSession(dataUrl);
  };

  const erasePixel = (x: number, y: number) => {
    const context = contextRef.current!;
    context.clearRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    // Update Canvas Data
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL();
    saveImageToSession(dataUrl);
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    event.preventDefault();

    if (event.button === 0) {
      setIsDrawing(true);
      activateTool(x, y);
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    if (isDrawing) activateTool(x, y);
  };

  const touchDraw = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    if (isDrawing) activateTool(x, y);
  };

  return (
    <>
      <section
        ref={wrapperRef}
        className={`grid place-content-center w-full h-full z-10`}
      >
        <article
          className={`relative w-full h-full`}
          onMouseEnter={() => setMouseInCanvas(true)}
          onMouseLeave={() => setMouseInCanvas(false)}
        >
          {/* Background */}
          <div
            className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full bg-${config.background} z-0`}
          >
            {config.background === "transparent" &&
              grid.map((row, rowIndex) => (
                <div
                  key={`transparent-row-${rowIndex}`}
                  className={`flex w-full grow`}
                >
                  {row.map((col, colIndex) => (
                    <div
                      key={`transparent-col-${colIndex}`}
                      className={`grow border border-dotted border-neutral-100/50 ${
                        (rowIndex + colIndex) % 2 === 0
                          ? "bg-neutral-400/60"
                          : "bg-neutral-600/60"
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
          </div>

          <canvas
            ref={canvasRef}
            className={`cursor-none relative w-full h-full z-50`}
            style={{
              aspectRatio: config.width / config.height,
            }}
            id={"canvas"}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={(event) => {
              let { clientX, clientY } = event.nativeEvent;

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
          ></canvas>

          {/*<div*/}
          {/*  id={"guide"}*/}
          {/*  className={`pointer-events-none absolute top-0 left-0 ${*/}
          {/*    showGrid ? "opacity-100" : "opacity-0"*/}
          {/*  } grid w-full h-full transition-all duration-300 z-0`}*/}
          {/*  style={{*/}
          {/*    gridTemplateColumns: `repeat(${config.width}, 1fr)`,*/}
          {/*    gridTemplateRows: `repeat(${config.height}, 1fr)`,*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {Array.from(Array(config.width * config.height)).map((_, index) => (*/}
          {/*    <div*/}
          {/*      key={`canvas-grid-${index}`}*/}
          {/*      className={` border-[1px] border-dotted border-neutral-100/30`}*/}
          {/*    ></div>*/}
          {/*  ))}*/}
          {/*</div>*/}
        </article>
      </section>

      <div
        ref={cursorRef}
        className={`pointer-events-none absolute ${
          mouseInCanvas ? "block" : "hidden"
        } z-50`}
        style={{
          transform: "translate(-15%, -80%)",
        }}
      >
        {getToolIcon()}
      </div>
    </>
  );
};

export default CanvasLayer;
