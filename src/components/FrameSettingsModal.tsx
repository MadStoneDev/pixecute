"use client";

import React, { useState, useEffect } from "react";
import { Artwork } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";
import { IconSettings, IconX, IconClock } from "@tabler/icons-react";

interface FrameSettingsModalProps {
  liveArtwork: Artwork;
  setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
  setHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FrameSettingsModal = ({
  liveArtwork,
  setLiveArtwork,
  setHasChanged,
}: FrameSettingsModalProps) => {
  const { selectedFrame } = useArtStore();
  const [isOpen, setIsOpen] = useState(false);
  const [frameDuration, setFrameDuration] = useState(100);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (selectedFrame < liveArtwork.frames.length) {
      setFrameDuration(liveArtwork.frames[selectedFrame]);
    }
  }, [selectedFrame, liveArtwork.frames, isOpen]);

  const handleSave = () => {
    const updatedArtwork = { ...liveArtwork };

    if (applyToAll) {
      updatedArtwork.frames = updatedArtwork.frames.map(() => frameDuration);
    } else {
      updatedArtwork.frames[selectedFrame] = frameDuration;
    }

    setLiveArtwork(updatedArtwork);
    setHasChanged(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (selectedFrame < liveArtwork.frames.length) {
      setFrameDuration(liveArtwork.frames[selectedFrame]);
    }
    setApplyToAll(false);
    setIsOpen(false);
  };

  const presets = [
    { label: "Very Fast", value: 50, fps: "20 FPS" },
    { label: "Fast", value: 83, fps: "12 FPS" },
    { label: "Normal", value: 100, fps: "10 FPS" },
    { label: "Slow", value: 167, fps: "6 FPS" },
    { label: "Very Slow", value: 333, fps: "3 FPS" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300"
        title="Frame Settings"
      >
        <IconSettings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded-2xl w-[320px] overflow-hidden border border-neutral-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-neutral-100">
          <div className="flex items-center gap-2">
            <IconClock size={20} />
            <h3 className="font-medium">Frame {selectedFrame + 1}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Duration Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={frameDuration}
                onChange={(e) =>
                  setFrameDuration(parseInt(e.target.value) || 100)
                }
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:border-primary-600"
              />
              <span className="text-sm text-neutral-600 font-medium">ms</span>
            </div>
            <div className="text-xs text-neutral-500">
              ≈ {Math.round(1000 / frameDuration)} FPS
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setFrameDuration(preset.value)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    frameDuration === preset.value
                      ? "bg-primary-600 text-neutral-100 border-primary-600"
                      : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-75">{preset.fps}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Apply to All */}
          <div className="flex items-center gap-3 p-3 bg-neutral-200 rounded-lg">
            <input
              type="checkbox"
              id="apply-all"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-600"
            />
            <label
              htmlFor="apply-all"
              className="text-sm text-neutral-700 cursor-pointer"
            >
              Apply to all {liveArtwork.frames.length} frames
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-neutral-300 bg-neutral-50">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-sm bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
