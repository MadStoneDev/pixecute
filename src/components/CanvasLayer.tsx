import React, { forwardRef, RefObject } from "react";
import { CanvasConfig } from "@/types/canvas";

interface CanvasLayerProps {
  ref: RefObject<HTMLCanvasElement>;
  config: CanvasConfig;
}

const CanvasLayer = forwardRef<HTMLCanvasElement, CanvasLayerProps>(
  ({ config }, ref) => {
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
