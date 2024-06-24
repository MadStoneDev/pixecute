"use client";

import React, { forwardRef, RefObject, useEffect, useRef } from "react";
import { CanvasConfig } from "@/types/canvas";

interface CanvasLayerProps {
  ref: RefObject<HTMLCanvasElement>;
  config: CanvasConfig;
  frame: ImageData | null;
  className?: string;
}

const CanvasLayer = forwardRef<HTMLCanvasElement, CanvasLayerProps>(
  ({ config, frame, className = "" }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas =
        (ref as RefObject<HTMLCanvasElement>).current! || internalRef.current!;
      if (!canvas) return;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      canvas.width = config.width;
      canvas.height = config.height;
      context.imageSmoothingEnabled = false;

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (frame) {
        context.putImageData(frame, 0, 0);
      }
    }, [frame, config]);

    return (
      <canvas
        ref={ref || internalRef}
        className={`cursor-no absolute top-0 left-0 z-50 transition-all duration-300 ${className}`}
        style={{
          aspectRatio: config.width / config.height,
          imageRendering: "pixelated",
        }}
      ></canvas>
    );
  },
);

export default CanvasLayer;
