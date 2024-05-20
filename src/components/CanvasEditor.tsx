"use client";

import React, { useEffect, useRef, useState } from "react";

interface CanvasEditorProps {
  canvasSize?: { x: number; y: number };
}

const CanvasEditor = ({ canvasSize = { x: 32, y: 16 } }: CanvasEditorProps) => {
  // States
  const [isDrawing, setIsDrawing] = useState(false);
  const [pixelSize, setPixelSize] = useState(100);
  const [colour, setColour] = useState("#000000");

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [colourHistory, setColourHistory] = useState({});

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const saveImageToSession = (value: string) => {
    sessionStorage.setItem("currentImage", value);
  };

  const getImageFromSession = (key: string) => {
    return sessionStorage.getItem(key);
  };

  useEffect(() => {
    saveImageToSession("");

    const handleResize = () => {
      const canvas = canvasRef.current!;
      const aspectRatio = canvasSize.x / canvasSize.y;

      if (!canvas) return;

      if (aspectRatio >= 1) {
        canvas.style.width = `100%`;

        const parentWidth = canvas.parentElement!.clientWidth;

        canvas.width = parentWidth;
        canvas.height = canvas.width / aspectRatio;

        setPixelSize(parentWidth / canvasSize.x);
      } else {
        canvas.style.height = `100%`;

        const parentHeight = canvas.parentElement!.clientHeight;

        canvas.height = parentHeight;
        canvas.width = canvas.height * aspectRatio;

        setPixelSize(parentHeight / canvasSize.y);
      }

      // Redraw Image
      const canvasData = getImageFromSession("currentImage");

      if (canvasData) {
        const context = canvas.getContext("2d");

        if (context) {
          contextRef.current = context;

          const img = new Image();

          img.src = canvasData;
          img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
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
    <section className={`relative w-full`}>
      <div
        id={"guide"}
        className={`pointer-events-none absolute top-0 left-0 grid w-full h-full border-[1px] border-neutral-100`}
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
      </div>

      <canvas
        ref={canvasRef}
        className={`cursor-pointer max-w-full max-h-full border`}
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

      <input
        type={"color"}
        value={colour}
        onChange={(event) => {
          setColour(event.target.value);
        }}
        className={`absolute -bottom-10 left-0`}
      />
    </section>
  );
};

export default CanvasEditor;
