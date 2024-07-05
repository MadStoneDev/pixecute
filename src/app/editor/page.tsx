import React from "react";
import dynamic from "next/dynamic";
import { DrawingBoard } from "@/components/DrawingBoard";

const SideToolbar = dynamic(() => import("@/components/SideToolbar"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main
      className={`lg:p-4 flex flex-row flex-nowrap w-full h-dvh transition-all duration-300 overflow-hidden z-10`}
    >
      <SideToolbar className={``} />
      <DrawingBoard className={`flex-grow`} />
    </main>
  );
}
