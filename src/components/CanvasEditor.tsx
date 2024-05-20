"use client";

import React, { useEffect, useRef, useState } from "react";
import CheckBox from "@/components/CheckBox";

interface CanvasEditorProps {
  canvasSize?: { x: number; y: number };
}

const CanvasEditor = ({ canvasSize = { x: 32, y: 16 } }: CanvasEditorProps) => {
  // States
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pixelSize, setPixelSize] = useState(100);
  const [colour, setColour] = useState("#000000");

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [colourHistory, setColourHistory] = useState({});

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const saveImageToSession = (value: string) => {
    sessionStorage.setItem("currentImage", value);
  };

  const getImageFromSession = (key: string) => {
    return sessionStorage.getItem(key);
  };

  const handleResize = (canvas: HTMLCanvasElement) => {
    const artworkRatio = canvasSize.x / canvasSize.y;

    const wrapperWidth = wrapperRef.current!.clientWidth;
    const wrapperHeight = wrapperRef.current!.clientHeight;
    const wrapperRatio = wrapperWidth / wrapperHeight;

    if (wrapperRatio >= 1) {
      canvas.style.width = `100%`;
      canvas.width = wrapperWidth;
      canvas.height = canvas.width / artworkRatio;

      const pixel = wrapperWidth / canvasSize.x;
      setPixelSize(pixel);
    } else {
      canvas.style.height = `100%`;
      canvas.height = wrapperHeight;
      canvas.width = canvas.height * artworkRatio;

      const pixel = wrapperHeight / canvasSize.y;
      setPixelSize(pixel);
    }

    // Redraw Image
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

    window.addEventListener("resize", () => handleResize(canvas));
    handleResize(canvas);

    return () =>
      window.removeEventListener("resize", () => handleResize(canvas));
  }, []);

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent,
  ) => {
    const rect = canvas.getBoundingClientRect();

    if (event instanceof MouseEvent) {
      return {
        x: Math.floor(
          (event.clientX - rect.left) / (rect.width / canvasSize.x),
        ),
        y: Math.floor(
          (event.clientY - rect.top) / (rect.height / canvasSize.y),
        ),
      };
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return {
        x: Math.floor(
          (touch.clientX - rect.left) / (rect.width / canvasSize.x),
        ),
        y: Math.floor(
          (touch.clientY - rect.top) / (rect.height / canvasSize.y),
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

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);

    setIsDrawing(true);
    drawPixel(x, y);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;

    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    drawPixel(x, y);
  };

  return (
    <>
      <section
        ref={wrapperRef}
        className={`relative grid place-content-center w-full max-h-full`}
      >
        <canvas
          ref={canvasRef}
          className={`cursor-pointer border`}
          style={{
            aspectRatio: canvasSize.x / canvasSize.y,
          }}
          id={"canvas"}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
        ></canvas>

        <article
          id={"guide"}
          className={`pointer-events-none absolute top-0 left-0 ${
            showGrid ? "opacity-100" : "opacity-0"
          } grid w-full h-full border-[1px] border-neutral-100 transition-all duration-300 z-50`}
          style={{
            gridTemplateColumns: `repeat(${canvasSize.x}, 1fr)`,
            gridTemplateRows: `repeat(${canvasSize.y}, 1fr)`,
          }}
        >
          {Array.from(Array(canvasSize.x * canvasSize.y)).map((_, index) => (
            <div
              key={`canvas-grid-${index}`}
              className={`border border-dotted border-neutral-300/40`}
            ></div>
          ))}
        </article>
      </section>

      <input
        type={"color"}
        value={colour}
        onChange={(event) => {
          setColour(event.target.value);
        }}
        className={``}
      />

      <CheckBox
        label={"Show Grid"}
        checked={showGrid}
        onChange={() => setShowGrid(!showGrid)}
      />
    </>
  );
};

export default CanvasEditor;
