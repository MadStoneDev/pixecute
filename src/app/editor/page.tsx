import { SideToolbar } from "@/components/SideToolbar";

export default function EditorPage() {
  return (
    <main
      className={`p-4 flex flex-col w-full h-dvh transition-all duration-300 overflow-hidden z-10`}
    >
      <SideToolbar />
    </main>
  );
}
