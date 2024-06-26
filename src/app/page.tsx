import Image from "next/image";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between w-full max-w-[1000px] h-dvh bg-neutral-100 dark:bg-neutral-900 shadow-xl shadow-neutral-900 z-10">
      <NavBar />
    </main>
  );
}
