import dynamic from "next/dynamic";
import { DrawingBoard } from "@/components/DrawingBoard";

const SideToolbar = dynamic(() => import("@/components/SideToolbar"), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <main
      className={`p-4 grid grid-cols-6 w-full h-dvh transition-all duration-300 overflow-hidden z-10`}
    >
      <SideToolbar className={`col-span-1`} />
      <DrawingBoard className={`col-span-5`} />
    </main>
  );
}
