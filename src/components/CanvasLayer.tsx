"use client";

import React, { forwardRef, RefObject, useEffect, useRef } from "react";
import { CanvasConfig } from "@/types/canvas";

interface CanvasLayerProps {
  ref: RefObject<HTMLCanvasElement>;
  config: CanvasConfig;
  frame: ImageData | null;
}

const CanvasLayer = forwardRef<HTMLCanvasElement, CanvasLayerProps>(
  ({ config, frame }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas =
        (ref as RefObject<HTMLCanvasElement>).current! || internalRef.current!;
      if (!canvas) return;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (frame) {
        context.putImageData(frame, 0, 0);
      }
    }, [frame]);

    return (
      <canvas
        ref={ref}
        className={`cursor-none relative z-50 transition-all duration-300`}
        style={{
          aspectRatio: config.width / config.height,
          imageRendering: "pixelated",
        }}
      ></canvas>
    );
  },
);

export default CanvasLayer;
