"use client";

import React, { useState } from "react";
import useArtStore from "@/utils/Zustand";
import { resizeCanvas, AnchorPosition } from "@/utils/CanvasResize";
import { IconX, IconResize } from "@tabler/icons-react";

interface CanvasResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANCHORS: { position: AnchorPosition; label: string }[] = [
  { position: "top-left", label: "TL" },
  { position: "top-center", label: "TC" },
  { position: "top-right", label: "TR" },
  { position: "middle-left", label: "ML" },
  { position: "middle-center", label: "MC" },
  { position: "middle-right", label: "MR" },
  { position: "bottom-left", label: "BL" },
  { position: "bottom-center", label: "BC" },
  { position: "bottom-right", label: "BR" },
];

export const CanvasResizeModal = ({
  isOpen,
  onClose,
}: CanvasResizeModalProps) => {
  const canvasSize = useArtStore((s) => s.canvasSize);
  const setCanvasSize = useArtStore((s) => s.setCanvasSize);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const setHasChanged = useArtStore((s) => s.setHasChanged);
  const pushToHistory = useArtStore((s) => s.pushToHistory);

  const [newWidth, setNewWidth] = useState(canvasSize.width);
  const [newHeight, setNewHeight] = useState(canvasSize.height);
  const [anchor, setAnchor] = useState<AnchorPosition>("middle-center");
  const [lockRatio, setLockRatio] = useState(false);
  const [ratio] = useState(canvasSize.width / canvasSize.height);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setNewWidth(canvasSize.width);
      setNewHeight(canvasSize.height);
      setAnchor("middle-center");
    }
  }, [isOpen, canvasSize]);

  const handleWidthChange = (w: number) => {
    setNewWidth(w);
    if (lockRatio && w > 0) {
      setNewHeight(Math.round(w / ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setNewHeight(h);
    if (lockRatio && h > 0) {
      setNewWidth(Math.round(h * ratio));
    }
  };

  const handleApply = () => {
    if (newWidth < 1 || newHeight < 1) return;
    if (newWidth === canvasSize.width && newHeight === canvasSize.height) {
      onClose();
      return;
    }

    pushToHistory("Resize canvas");
    const resized = resizeCanvas(liveArtwork, newWidth, newHeight, anchor);
    setLiveArtwork(resized);
    setCanvasSize({ width: newWidth, height: newHeight });
    setHasChanged(true);
    onClose();
  };

  if (!isOpen) return null;

  const diffW = newWidth - canvasSize.width;
  const diffH = newHeight - canvasSize.height;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded-2xl w-[360px] overflow-hidden border border-neutral-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-neutral-100">
          <div className="flex items-center gap-2">
            <IconResize size={20} />
            <h3 className="font-medium">Resize Canvas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current size */}
          <div className="text-xs text-neutral-500">
            Current: {canvasSize.width} x {canvasSize.height}px
          </div>

          {/* New dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">
                Width
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={512}
                  value={newWidth}
                  onChange={(e) =>
                    handleWidthChange(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:border-primary-600 text-sm"
                />
                <span className="text-xs text-neutral-500">px</span>
              </div>
              {diffW !== 0 && (
                <span
                  className={`text-xs ${diffW > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {diffW > 0 ? "+" : ""}
                  {diffW}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">
                Height
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={512}
                  value={newHeight}
                  onChange={(e) =>
                    handleHeightChange(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:border-primary-600 text-sm"
                />
                <span className="text-xs text-neutral-500">px</span>
              </div>
              {diffH !== 0 && (
                <span
                  className={`text-xs ${diffH > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {diffH > 0 ? "+" : ""}
                  {diffH}
                </span>
              )}
            </div>
          </div>

          {/* Lock ratio */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lockRatio}
              onChange={(e) => setLockRatio(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Lock aspect ratio</span>
          </label>

          {/* Anchor grid */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Anchor Point
            </label>
            <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
              {ANCHORS.map(({ position, label }) => (
                <button
                  key={position}
                  onClick={() => setAnchor(position)}
                  className={`w-10 h-10 rounded border text-xs font-medium transition-colors ${
                    anchor === position
                      ? "bg-primary-600 text-neutral-100 border-primary-600"
                      : "bg-neutral-200 text-neutral-600 border-neutral-300 hover:bg-neutral-300"
                  }`}
                  title={position}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Existing art stays anchored to the{" "}
              <span className="font-medium">{anchor}</span>
            </p>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Presets
            </label>
            <div className="flex flex-wrap gap-1">
              {[8, 16, 32, 48, 64, 96, 128, 256].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setNewWidth(size);
                    setNewHeight(size);
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    newWidth === size && newHeight === size
                      ? "bg-primary-600 text-neutral-100 border-primary-600"
                      : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                  }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-neutral-300 bg-neutral-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors"
          >
            Resize
          </button>
        </div>
      </div>
    </div>
  );
};
