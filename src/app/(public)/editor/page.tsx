import CanvasLayer from "@/components/CanvasLayer";
import { decodedUrl } from "@/utilities/GeneralUtils";
import CheckBox from "@/components/CheckBox";
import React from "react";
import EditorContainer from "@/components/EditorContainer";

interface EditorPageProps {
  searchParams: { [key: string]: string };
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  let config = searchParams.new
    ? decodedUrl(searchParams.new)
    : { width: 16, height: 16, background: "transparent" };

  return <EditorContainer config={config} />;
}
