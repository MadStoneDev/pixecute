"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import useArtStore from "@/utils/Zustand";
import { DRAWING_TOOLS, FILE_TOOLS } from "@/data/DefaultTools";

import Logo from "@/components/Logo";
import { PuffLoader } from "react-spinners";
import { ColourWheel } from "@/components/ColourWheel";
import { Route } from "next";

const SideToolbar = ({ className = "" }: { className: string }) => {
  // Hooks
  const router = useRouter();

  // States

  // Zustand
  const {
    previousTool,
    selectedTool,
    selectedColour,
    colourPalette,
    setPreviousTool,
    setSelectedTool,
    isSaving,
  } = useArtStore();

  const handleToolSelect = (index: number) => {
    const currentTool = selectedTool;

    // 0: select, 1: pencil, 2: picker, 3: eraser, 4: fill, 5: move
    setSelectedTool(index);

    if (index === currentTool) return;
    setPreviousTool(currentTool);
  };

  return (
    <div className={`relative flex flex-row h-full z-20 ${className}`}>
      <section
        className={`relative flex flex-col w-16 lg:w-24 h-full bg-neutral-100 lg:rounded-2xl z-10 overflow-hidden`}
      >
        {/* Drawing-Related Tools */}
        <article
          className={`flex-grow lg:px-4 lg:py-4 flex flex-col items-center overflow-y-auto`}
        >
          {DRAWING_TOOLS.map((tool, index) => (
            <div
              key={`drawing-tool-${index}`}
              className={`cursor-pointer px-1 py-3 lg:py-6 flex flex-col items-center justify-center w-full border-b border-neutral-300/50 ${
                selectedTool === index
                  ? "text-primary-600"
                  : "text-neutral-900 hover:text-neutral-100/90 hover:bg-primary-600"
              } transition-all duration-300`}
              onClick={() => handleToolSelect(index)}
            >
              {tool.icon}
            </div>
          ))}
        </article>

        <div
          className={`my-2 relative mx-auto flex items-center justify-center w-9 min-w-9 min-h-9 rounded-full border-[2px] border-neutral-300`}
        >
          <div
            className={`w-[85%] h-[85%] rounded-full`}
            style={{ backgroundColor: selectedColour }}
          ></div>
        </div>

        <div
          className={`p-4 flex gap-1 items-center justify-center lg:justify-start text-xs italic text-emerald-600/50 ${
            isSaving ? "" : "pointer-events-none opacity-0"
          }`}
        >
          <PuffLoader size={20} color="green" />
          <span className={`hidden lg:block`}>saving...</span>
        </div>

        {/* File-Related Tools */}
        <article className={`mx-4 border-t border-neutral-300/60`}>
          {FILE_TOOLS.map((tool, index) => (
            <div
              key={`file-tool-${index}`}
              className={`cursor-pointer px-0.5 py-3 flex items-center justify-center lg:justify-start gap-1 hover:bg-primary-600 text-neutral-900 hover:text-neutral-100/90 transition-all duration-300`}
              onClick={() => {
                if (tool.name === "New") {
                  router.push(`/` as Route);
                } else if (tool.name === "Export") {
                }
              }}
            >
              {tool.icon}
              <span className={`hidden lg:block text-xs font-bold text-center`}>
                {tool.name}
              </span>
            </div>
          ))}
        </article>

        {/* Toolbar Footer */}
        <Link
          href={`/`}
          className={`mx-4 py-6 flex flex-col items-center border-t border-neutral-300/60`}
        >
          <Logo className="w-6 h-6" />
          <span
            className={`text-xs lg:text-sm font-bold text-secondary uppercase`}
          >
            Pixecute
          </span>
        </Link>
      </section>

      {/* Colour Menu */}
      <ColourWheel />
    </div>
  );
};

export default React.memo(SideToolbar);
