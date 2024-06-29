"use client";

import React, { forwardRef, RefObject, useEffect, useRef } from "react";
import { CanvasConfig } from "@/types/canvas";

interface CanvasLayerProps {
  ref: RefObject<HTMLCanvasElement>;
  canvasSize: { width: number; height: number };
  frame: ImageData | null;
  className?: string;
}

const CanvasLayer = forwardRef<HTMLCanvasElement, CanvasLayerProps>(
  ({ canvasSize, frame, className = "" }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas =
        (ref as RefObject<HTMLCanvasElement>).current! || internalRef.current!;
      if (!canvas) return;

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (frame) {
        context.putImageData(frame, 0, 0);
      }
    }, [frame]);

    return (
      <canvas
        ref={ref || internalRef}
        className={`cursor-no absolute top-0 left-0 w-full h-full z-10 transition-all duration-300 ${className}`}
        style={{
          imageRendering: "pixelated",
        }}
      ></canvas>
    );
  },
);

export default CanvasLayer;
