import Image from "next/image";
import CanvasEditor from "@/components/CanvasEditor";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <CanvasEditor />

      <section className={`flex gap-2`}>
        <label htmlFor="toggleGrid">Show Grid</label>
        <input type="checkbox" id="toggleGrid" checked />
      </section>

      <button type={"button"}>Clear</button>
    </main>
  );
}
