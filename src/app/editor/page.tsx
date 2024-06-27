import { SideToolbar } from "@/components/SideToolbar";
import { DrawingBoard } from "@/components/DrawingBoard";

export default function EditorPage() {
  return (
    <main
      className={`p-4 flex flex-row w-full h-dvh transition-all duration-300 overflow-hidden z-10`}
    >
      <SideToolbar />
      <DrawingBoard />
    </main>
  );
}
