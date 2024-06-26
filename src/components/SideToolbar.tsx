"use client";

import Logo from "@/components/Logo";
import {
  IconArrowsMove,
  IconEraser,
  IconFilePlus,
  IconMarquee2,
  IconPencil,
  IconUpload,
} from "@tabler/icons-react";
import { PaintBucket, Pipette } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ColourWheel } from "@/components/ColourWheel";

export const SideToolbar = () => {
  // States
  // initialise to pencil;
  const [previousTool, setPreviousTool] = useState(1);
  const [selectedTool, setSelectedTool] = useState(1);
  const [keyIdentifier, setKeyIdentifier] = useState("");

  const router = useRouter();

  const handleToolSelect = (index: number) => {
    console.log("Here");

    const previousToolables = ["pencil", "eraser", "fill"];

    if (previousToolables.includes(DRAWING_TOOLS[selectedTool].name)) {
      setPreviousTool(selectedTool);
    }

    setSelectedTool(index);
  };

  return (
    <section
      className={`relative flex flex-col max-w-28 h-full bg-neutral-100 rounded-2xl`}
      style={{
        boxShadow: "15px 0 20px rgba(0, 0, 0, 0.15)",
      }}
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
            <span className={`text-xs font-bold text-center`}>{tool.name}</span>
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
      <ColourWheel className={`-z-10`} />
    </section>
  );
};

const FILE_TOOLS = [
  {
    name: "New",
    icon: <IconFilePlus size={26} />,
  },
  {
    name: "Export",
    icon: <IconUpload size={26} />,
  },
];

const DRAWING_TOOLS = [
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
