import React from "react";

export const LiveDrawingArea = () => {
  return (
    <section className={`flex-grow w-full`}>
      <canvas className={`w-full h-full`}></canvas>
    </section>
  );
};
