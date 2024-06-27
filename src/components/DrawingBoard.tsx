import { AnimationControl } from "@/components/AnimationControl";
import { LiveDrawingArea } from "@/components/LiveDrawingArea";
import { LayerControl } from "@/components/LayerControl";
import React from "react";

export const DrawingBoard = React.memo(() => {
  return (
    <div
      className={`relative flex-grow flex flex-col items-center justify-between gap-5 h-full`}
    >
      {/* Live Area */}
      <LiveDrawingArea />

      {/* Layer / Frame Control */}
      <LayerControl />

      {/* Animation Control */}
      <AnimationControl />
    </div>
  );
});
