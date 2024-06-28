import React from "react";
import dynamic from "next/dynamic";

const LiveDrawingArea = dynamic(() => import("@/components/LiveDrawingArea"), {
  ssr: false,
});

const LayerControl = dynamic(() => import("@/components/LayerControl"), {
  ssr: false,
});

const AnimationControl = dynamic(
  () => import("@/components/AnimationControl"),
  {
    ssr: false,
  },
);

export const DrawingBoard = React.memo(
  ({ className = "" }: { className: string }) => {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Live Area */}
        <LiveDrawingArea />

        {/* Layer / Frame Control */}
        <LayerControl />

        {/* Animation Control */}
        {/*<AnimationControl />*/}
      </div>
    );
  },
);
