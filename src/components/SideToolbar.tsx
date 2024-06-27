"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Logo from "@/components/Logo";
import { ColourWheel } from "@/components/ColourWheel";
import { FileTool, DrawingTool } from "@/types/canvas";

import {
  IconArrowsMove,
  IconEraser,
  IconFilePlus,
  IconMarquee2,
  IconPencil,
  IconUpload,
} from "@tabler/icons-react";
import { PaintBucket, Pipette } from "lucide-react";

export const SideToolbar = () => {
  // Hooks
  const router = useRouter();

  // States
  const [previousTool, setPreviousTool] = useState(1);
  const [selectedTool, setSelectedTool] = useState(1);

  const handleToolSelect = (index: number) => {
    const previousToolables = ["pencil", "eraser", "fill"];

    if (
      previousToolables.includes(DRAWING_TOOLS[selectedTool].name.toLowerCase())
    ) {
      sessionStorage.setItem("previousTool", selectedTool.toString());
      setPreviousTool(selectedTool);
    }

    sessionStorage.setItem("selectedTool", index.toString());
    setSelectedTool(index);
  };

  return (
    <div className={`flex flex-row w-52 h-full`}>
      <section
        className={`relative flex flex-col w-28 h-full bg-neutral-100 rounded-2xl`}
      >
        {/* Drawing-Related Tools */}
        <article
          className={`flex-grow mx-4 py-4 flex flex-col items-center border-b-2 border-neutral-300/60`}
        >
          {DRAWING_TOOLS.map((tool, index) => (
            <div
              key={`drawing-tool-${index}`}
              className={`cursor-pointer px-1 py-5 flex flex-col items-center justify-center w-full border-b border-neutral-300/50 ${
                selectedTool === index
                  ? "text-primary-600"
                  : "text-neutral-900 hover:text-neutral-100/90 hover:bg-primary-600"
              } transition-all duration-500`}
              onClick={() => handleToolSelect(index)}
            >
              {tool.icon}
            </div>
          ))}
        </article>

        {/* File-Related Tools */}
        <article className={`mx-4`}>
          {FILE_TOOLS.map((tool, index) => (
            <div
              key={`file-tool-${index}`}
              className={`cursor-pointer px-0.5 py-3 flex items-center justify-start gap-1 hover:bg-primary-600 text-secondary/75 hover:text-neutral-100/90 transition-all duration-500`}
            >
              {tool.icon}
              <span className={`text-xs font-bold text-center`}>
                {tool.name}
              </span>
            </div>
          ))}
        </article>

        {/* Toolbar Footer */}
        <Link
          href={`/`}
          className={`mx-4 py-6 flex flex-col items-center border-t-2 border-neutral-300/60`}
        >
          <Logo className="w-6 h-6" />
          <span className={`text-sm font-bold text-secondary uppercase`}>
            Pixecute
          </span>
        </Link>

        {/* Colour Menu */}
      </section>

      <ColourWheel />
    </div>
  );
};

const FILE_TOOLS: FileTool[] = [
  {
    name: "New",
    icon: <IconFilePlus size={26} />,
  },
  {
    name: "Export",
    icon: <IconUpload size={26} />,
  },
];

const DRAWING_TOOLS: DrawingTool[] = [
  {
    name: "Select",
    icon: <IconMarquee2 size={32} />,
    trigger: "down",
  },
  {
    name: "Pencil",
    icon: <IconPencil size={32} />,
    trigger: "down",
  },
  // {
  //   name: "Brush",
  //   icon: <IconBrush size={32} />,
  //   trigger: "down",
  //   subTools: [
  //     {
  //       name: "Brush",
  //       icon: <IconBrush size={32} />,
  //     },
  //   ],
  // },
  {
    name: "Picker",
    icon: <Pipette size={30} />,
    trigger: "up",
  },
  {
    name: "Eraser",
    icon: <IconEraser size={32} />,
    trigger: "down",
  },
  {
    name: "Fill",
    icon: <PaintBucket size={30} style={{ transform: "scaleX(-1)" }} />,
    trigger: "up",
  },
  // {
  //   name: "Line",
  //   icon: <IconLine size={30} />,
  //   trigger: "down",
  // },
  // {
  //   name: "Shape",
  //   icon: <IconShape size={30} />,
  //   trigger: "down",
  // },
  {
    name: "Move",
    icon: <IconArrowsMove size={32} />,
    trigger: "down",
  },
];
