import CanvasLayer from "@/components/CanvasLayer";
import { decodedUrl } from "@/utilities/GeneralUtils";
import CheckBox from "@/components/CheckBox";
import React from "react";

interface EditorPageProps {
  searchParams: { [key: string]: string };
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  let config = searchParams.new
    ? decodedUrl(searchParams.new)
    : { width: 16, height: 64, background: "white" };

  return (
    <main
      className={`m-5 flex flex-col items-center justify-center gap-5 w-full h-[500px]`}
    >
      <CanvasLayer config={config} />
    </main>
  );
}
