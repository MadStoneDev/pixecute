"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

import useArtStore from "@/utils/Zustand";
import { DRAWING_TOOLS, FILE_TOOLS } from "@/data/DefaultTools";
import { ToolId } from "@/types/canvas";

import Logo from "@/components/Logo";
import { ExportModal } from "@/components/ExportModal";
import { AuthModal } from "@/components/AuthModal";
import { CanvasResizeModal } from "@/components/CanvasResizeModal";
import { PuffLoader } from "react-spinners";
import { ColourWheel } from "@/components/ColourWheel";
import { IconLayersSubtract, IconMinus, IconPlus } from "@tabler/icons-react";
import { saveToCloud, getCurrentUser, isCloudEnabled } from "@/utils/CloudSync";

const SideToolbar = ({ className = "" }: { className: string }) => {
  const router = useRouter();
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showResizeModal, setShowResizeModal] = React.useState(false);
  const [cloudSaving, setCloudSaving] = React.useState(false);

  // Granular selectors
  const selectedTool = useArtStore((s) => s.selectedTool);
  const selectedColour = useArtStore((s) => s.selectedColour);
  const setPreviousTool = useArtStore((s) => s.setPreviousTool);
  const setSelectedTool = useArtStore((s) => s.setSelectedTool);
  const isSaving = useArtStore((s) => s.isSaving);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const moveAllLayers = useArtStore((s) => s.moveAllLayers);
  const setMoveAllLayers = useArtStore((s) => s.setMoveAllLayers);
  const brushSize = useArtStore((s) => s.brushSize);
  const setBrushSize = useArtStore((s) => s.setBrushSize);
  const pressureMode = useArtStore((s) => s.pressureMode);
  const setPressureMode = useArtStore((s) => s.setPressureMode);

  const handleToolSelect = (toolId: ToolId) => {
    const currentTool = selectedTool;
    setSelectedTool(toolId);
    if (toolId === currentTool) return;
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
          {DRAWING_TOOLS.map((tool) => (
            <button
              key={`drawing-tool-${tool.id}`}
              className={`relative cursor-pointer px-1 py-3 lg:py-6 flex flex-col items-center justify-center w-full border-b border-neutral-300/50 ${
                selectedTool === tool.id
                  ? "text-primary-600"
                  : "text-neutral-900 hover:text-neutral-100/90 hover:bg-primary-600"
              } transition-all duration-300`}
              onClick={() => handleToolSelect(tool.id)}
              aria-label={tool.name}
              title={tool.name}
            >
              {tool.icon}

              {/* Move Tool Toggle */}
              {tool.id === "move" && (
                <button
                  className={`absolute -bottom-3 right-0 p-1 rounded-full text-xs ${
                    moveAllLayers
                      ? "bg-primary-600 text-neutral-100"
                      : "bg-neutral-300 text-neutral-700"
                  } hover:scale-110 transition-all duration-200`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveAllLayers(!moveAllLayers);
                  }}
                  title={
                    moveAllLayers
                      ? "Move all layers"
                      : "Move current layer only"
                  }
                >
                  <IconLayersSubtract size={18} />
                </button>
              )}
            </button>
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

        {/* Brush Size Control */}
        <div className="mx-2 py-1 flex flex-col items-center gap-1 border-t border-neutral-300/60">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBrushSize(brushSize - 1)}
              disabled={brushSize <= 1}
              className="p-0.5 hover:bg-neutral-300 rounded disabled:opacity-30 transition-colors"
            >
              <IconMinus size={12} />
            </button>
            <span className="text-xs font-medium w-5 text-center text-neutral-700">
              {brushSize}
            </span>
            <button
              onClick={() => setBrushSize(brushSize + 1)}
              disabled={brushSize >= 16}
              className="p-0.5 hover:bg-neutral-300 rounded disabled:opacity-30 transition-colors"
            >
              <IconPlus size={12} />
            </button>
          </div>
          {/* Pressure Mode Toggle */}
          <button
            onClick={() => {
              const modes: Array<"none" | "opacity" | "size" | "both"> = [
                "none",
                "opacity",
                "size",
                "both",
              ];
              const idx = modes.indexOf(pressureMode);
              setPressureMode(modes[(idx + 1) % modes.length]);
            }}
            className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
              pressureMode !== "none"
                ? "bg-primary-600/20 text-primary-600"
                : "text-neutral-500 hover:bg-neutral-200"
            }`}
            title={`Pressure: ${pressureMode}`}
          >
            P:{pressureMode === "none" ? "off" : pressureMode}
          </button>
        </div>

        <div
          className={`p-4 flex gap-1 items-center justify-center lg:justify-start text-xs italic ${
            isSaving || cloudSaving ? "" : "pointer-events-none opacity-0"
          } ${cloudSaving ? "text-blue-500/50" : "text-emerald-600/50"}`}
        >
          <PuffLoader size={20} color={cloudSaving ? "blue" : "green"} />
          <span className={`hidden lg:block`}>
            {cloudSaving ? "cloud..." : "saving..."}
          </span>
        </div>

        {/* File-Related Tools */}
        <article
          className={`mx-4 py-4 flex flex-col items-center gap-1 border-t border-neutral-300/60`}
        >
          {FILE_TOOLS.map((tool, index) => (
            <button
              key={`file-tool-${index}`}
              className={`cursor-pointer p-3 flex items-center justify-center gap-1 w-full hover:bg-primary-600 text-neutral-900 hover:text-neutral-100/90 transition-all duration-300`}
              onClick={async () => {
                if (tool.name === "New") {
                  router.push(`/`);
                } else if (tool.name === "Export") {
                  setShowExportModal(true);
                } else if (tool.name === "Cloud Save") {
                  if (!isCloudEnabled()) {
                    alert("Cloud features are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.");
                    return;
                  }
                  const user = await getCurrentUser();
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setCloudSaving(true);
                  await saveToCloud(liveArtwork);
                  setCloudSaving(false);
                } else if (tool.name === "") {
                  // Settings button — open canvas resize
                  setShowResizeModal(true);
                }
              }}
              aria-label={tool.name || "Settings"}
              title={tool.name || "Settings"}
            >
              {tool.icon}
            </button>
          ))}
        </article>

        {/* Toolbar Footer */}
        <Link
          href={`/`}
          className={`mx-4 py-3 flex flex-col items-center border-t border-neutral-300/60`}
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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Canvas Resize Modal */}
      <CanvasResizeModal
        isOpen={showResizeModal}
        onClose={() => setShowResizeModal(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={async () => {
          setShowAuthModal(false);
          setCloudSaving(true);
          await saveToCloud(liveArtwork);
          setCloudSaving(false);
        }}
      />
    </div>
  );
};

export default React.memo(SideToolbar);
