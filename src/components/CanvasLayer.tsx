"use client";

import React, { useEffect, useRef, useState } from "react";
import CreateGrid from "@/utilities/CreateGrid";
import { IconPencil, TablerIcon } from "@tabler/icons-react";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

interface CanvasEditorProps {
  config?: CanvasConfig;
  colour?: string;
}

const CanvasLayer = ({
  config = { width: 32, height: 16, background: "transparent" },
  colour = "#000",
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
  const cursorRef = useRef<HTMLDivElement>(null);

  const grid = CreateGrid(config.width, config.height);

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

    context.fillStyle = "transparent";
    context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    // Update Canvas Data
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL();
    saveImageToSession(dataUrl);
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(event.button === 0);
  };

  const finishDrawing = () => {
    setIsErasing(false);
    setIsDrawing(false);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    let clientX: number, clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      return;
    }

    if (cursorRef.current) {
      cursorRef.current!.style.left = clientX + "px";
      cursorRef.current!.style.top = clientY + "px";
    }

    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    if (isDrawing) drawPixel(x, y);
    else if (isErasing) erasePixel(x, y);
  };

  return (
    <>
      <section
        ref={wrapperRef}
        className={`relative grid place-content-center w-full h-full`}
      >
        <article
          className={`relative w-full h-full`}
          onMouseEnter={() => setMouseInCanvas(true)}
          onMouseLeave={() => setMouseInCanvas(false)}
        >
          {/* Background */}
          <div
            className={`absolute flex flex-col w-full h-full bg-${config.background} -z-10`}
          >
            {config.background === "transparent" &&
              grid.map((row, rowIndex) => (
                <div
                  key={`transparent-row-${rowIndex}`}
                  className={`flex w-full grow opacity-40`}
                >
                  {row.map((col, colIndex) => (
                    <div
                      key={`transparent-col-${colIndex}`}
                      className={`grow border border-dotted border-neutral-100/50 ${
                        (rowIndex + colIndex) % 2 === 0
                          ? "bg-neutral-300"
                          : "bg-neutral-600"
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
          </div>

          <canvas
            ref={canvasRef}
            className={`cursor-none w-full h-full bg-${config.background} z-20`}
            style={{
              aspectRatio: config.width / config.height,
            }}
            id={"canvas"}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onTouchStart={() => setIsDrawing(true)}
            onTouchEnd={finishDrawing}
            onTouchMove={draw}
          ></canvas>

          <div
            id={"guide"}
            className={`pointer-events-none absolute top-0 left-0 ${
              showGrid ? "opacity-100" : "opacity-0"
            } grid w-full h-full transition-all duration-300 z-50`}
            style={{
              gridTemplateColumns: `repeat(${config.width}, 1fr)`,
              gridTemplateRows: `repeat(${config.height}, 1fr)`,
            }}
          >
            {Array.from(Array(config.width * config.height)).map((_, index) => (
              <div
                key={`canvas-grid-${index}`}
                className={` border-[1px] border-dotted border-neutral-100/30`}
              ></div>
            ))}
          </div>
        </article>
      </section>

      {/*<input*/}
      {/*  type={"color"}*/}
      {/*  value={colour}*/}
      {/*  onChange={(event) => {*/}
      {/*    setColour(event.target.value);*/}
      {/*  }}*/}
      {/*  className={``}*/}
      {/*/>*/}

      {/*<CheckBox*/}
      {/*  label={"Show Grid"}*/}
      {/*  checked={showGrid}*/}
      {/*  onChange={() => setShowGrid(!showGrid)}*/}
      {/*/>*/}

      <div ref={cursorRef}>
        <IconPencil
          size={26}
          className={`pointer-events-none absolute ${
            mouseInCanvas ? "block" : "hidden"
          } stroke-[1.35px] z-50`}
          style={{
            fill: colour,
            transform: "translate(-15%, -75%)",
          }}
        />
      </div>
    </>
  );
};

export default CanvasLayer;
