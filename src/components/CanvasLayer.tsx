// components/CanvasLayer.tsx
"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

interface CanvasLayerProps {
  canvasSize: { width: number; height: number };
  frame: ImageData | null;
  className?: string;
  opacity?: number; // 0-1 range
  blendMode?: string;
}

export interface CanvasLayerRef {
  getCanvas: () => HTMLCanvasElement | null;
  forceUpdate: () => void;
}

const CanvasLayer = forwardRef<CanvasLayerRef, CanvasLayerProps>(
  (
    {
      canvasSize,
      frame,
      className = "",
      opacity = 1, // 0-1 range
      blendMode = "source-over",
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLCanvasElement>(null);

    const mapBlendMode = (mode: string): string => {
      const blendModeMap: { [key: string]: string } = {
        "source-over": "normal",
        multiply: "multiply",
        screen: "screen",
        overlay: "overlay",
        darken: "darken",
        lighten: "lighten",
        "color-dodge": "color-dodge",
        "color-burn": "color-burn",
        "hard-light": "hard-light",
        "soft-light": "soft-light",
        difference: "difference",
        exclusion: "exclusion",
        hue: "hue",
        saturation: "saturation",
        color: "color",
        luminosity: "luminosity",
      };

      return blendModeMap[mode] || "normal";
    };

    const renderFrame = () => {
      const canvas = internalRef.current;
      if (!canvas) return;

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (frame && frame.width > 1 && frame.height > 1) {
        context.putImageData(frame, 0, 0);
      }
    };

    useEffect(() => {
      renderFrame();
    }, [frame, canvasSize]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => internalRef.current,
      forceUpdate: () => renderFrame(),
    }));

    return (
      <canvas
        ref={internalRef}
        className={`absolute top-0 left-0 w-full h-full z-10 transition-all duration-300 ${className}`}
        style={{
          imageRendering: "pixelated",
          opacity: opacity, // Already 0-1
          mixBlendMode: mapBlendMode(blendMode) as any,
        }}
      />
    );
  },
);

CanvasLayer.displayName = "CanvasLayer";

export default CanvasLayer;
