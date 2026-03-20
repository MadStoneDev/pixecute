// components/LayerControl.tsx

"use client";

import React, { useCallback, useEffect } from "react";
import { useState } from "react";

import useArtStore from "@/utils/Zustand";
import { saveArtwork } from "@/utils/IndexedDB";
import { LayerRow } from "@/components/LayerRow";
import { FrameSettingsModal } from "@/components/FrameSettingsModal";
import {
  addNewFrame,
  deleteFrame,
  duplicateFrame,
  deleteFrames,
  duplicateFrames,
  changeFramesTimingBatch,
} from "@/utils/CanvasFrames";

import {
  addNewLayer,
  duplicateLayer,
  moveLayerDown,
  moveLayerUp,
} from "@/utils/CanvasLayers";
import { reorderFrame } from "@/utils/CanvasFrames";
import { getGroupForFrame } from "@/utils/AnimationGroups";

import {
  IconEye,
  IconTrash,
  IconLockOpen,
  IconNewSection,
  IconLayersSubtract,
  IconCopy,
  IconSquareArrowUp,
  IconSquareArrowDown,
  IconMovie,
  IconSettings,
} from "@tabler/icons-react";

const LAYER_CONTROLS = [
  {
    name: "Lock Layer",
    icon: <IconLockOpen size={16} />,
  },
  {
    name: "Show / Hide Layer",
    icon: <IconEye size={16} />,
  },
  {
    name: "Layer Settings",
    icon: <IconSettings size={16} />,
  },
  {
    name: "Delete Layer",
    icon: <IconTrash size={16} />,
  },
];

// Stable group colors for visual coding
const GROUP_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
];

const LayerControl = React.memo(
  ({
    isLoading,
    setIsLoading,
  }: {
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const [openControls, setOpenControls] = useState(false);
    const [saveInterval] = useState<number>(10 * 1000);
    const [dragFromFrame, setDragFromFrame] = useState<number | null>(null);
    const [dragOverFrame, setDragOverFrame] = useState<number | null>(null);
    const [selectedFrames, setSelectedFrames] = useState<Set<number>>(
      new Set(),
    );
    const [batchTiming, setBatchTiming] = useState(100);

    // Granular selectors
    const selectedLayer = useArtStore((s) => s.selectedLayer);
    const setSelectedLayer = useArtStore((s) => s.setSelectedLayer);
    const selectedFrame = useArtStore((s) => s.selectedFrame);
    const setSelectedFrame = useArtStore((s) => s.setSelectedFrame);
    const setIsSaving = useArtStore((s) => s.setIsSaving);
    const liveArtwork = useArtStore((s) => s.liveArtwork);
    const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
    const setHasChanged = useArtStore((s) => s.setHasChanged);
    const pushToHistory = useArtStore((s) => s.pushToHistory);

    const toggleControls = useCallback(() => {
      setOpenControls(!openControls);
    }, [openControls]);

    const checkAndSave = useCallback(async () => {
      setIsSaving(true);
      await saveArtwork(liveArtwork);

      setTimeout(() => {
        setIsSaving(false);
      }, 3000);
    }, [liveArtwork, setIsSaving]);

    useEffect(() => {
      if (selectedFrame > liveArtwork.frames.length - 1) {
        setSelectedFrame(liveArtwork.frames.length - 1);
      }

      if (selectedLayer > liveArtwork.layers.length - 1) {
        setSelectedLayer(liveArtwork.layers.length - 1);
      }

      let intervalId = setInterval(() => {
        checkAndSave().then();
      }, saveInterval);
      return () => clearInterval(intervalId);
    }, [
      selectedFrame,
      selectedLayer,
      saveInterval,
      checkAndSave,
      liveArtwork,
      setSelectedFrame,
      setSelectedLayer,
    ]);

    return (
      <section
        className={`pointer-events-none flex items-stretch justify-end gap-3 w-full max-h-56 lg:max-h-64 min-h-56 font-normal text-neutral-900`}
      >
        <article
          className={`pointer-events-auto flex items-stretch gap-2 w-full ${
            openControls ? "max-w-full" : "max-w-0"
          } bg-neutral-100 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out z-30`}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div
            className={`flex flex-col items-stretch justify-start w-full overflow-hidden`}
          >
            <section
              className={`flex-grow relative flex flex-col items-stretch justify-center w-full min-w-fit overflow-x-auto`}
            >
              {/* Header Row */}
              <article
                className={`px-2 py-2.5 flex flex-row border-b border-neutral-900 bg-neutral-400/50`}
              >
                {LAYER_CONTROLS.map((control, index) => (
                  <div
                    key={`layer-control-${index}`}
                    className={`cursor-pointer px-2 grid place-content-center w-8 ${
                      index === LAYER_CONTROLS.length - 1
                        ? ""
                        : "border-r border-neutral-300/60"
                    } transition-all duration-300`}
                    onClick={toggleControls}
                  >
                    {control.icon}
                  </div>
                ))}

                <span
                  className={`px-2 grid items-center w-40 border-x border-neutral-900 text-sm`}
                >
                  Layer Name
                </span>

                <article className={`flex-grow flex flex-row items-center`}>
                  {liveArtwork.frames.map((_, fIndex) => {
                    const group = getGroupForFrame(liveArtwork, fIndex);
                    const groupIdx = group
                      ? (liveArtwork.groups ?? []).indexOf(group)
                      : -1;
                    const groupColor =
                      groupIdx >= 0
                        ? GROUP_COLORS[groupIdx % GROUP_COLORS.length]
                        : "";

                    return (
                      <div
                        key={`frame-indicator-${fIndex}`}
                        className={`cursor-pointer grid items-center w-8 border-r border-neutral-300/60 text-sm text-center relative ${
                          fIndex === selectedFrame
                            ? "font-bold text-primary-600"
                            : ""
                        } ${
                          selectedFrames.has(fIndex)
                            ? "bg-primary-600/30"
                            : ""
                        } ${
                          dragOverFrame === fIndex && dragFromFrame !== null
                            ? "bg-primary-600/20"
                            : ""
                        } transition-all duration-300`}
                        draggable
                        onDragStart={() => setDragFromFrame(fIndex)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverFrame(fIndex);
                        }}
                        onDragLeave={() => setDragOverFrame(null)}
                        onDrop={() => {
                          if (
                            dragFromFrame !== null &&
                            dragFromFrame !== fIndex
                          ) {
                            pushToHistory("Reorder frame");
                            const updated = reorderFrame(
                              liveArtwork,
                              dragFromFrame,
                              fIndex,
                            );
                            setLiveArtwork(updated);
                            setSelectedFrame(fIndex);
                            setHasChanged(true);
                          }
                          setDragFromFrame(null);
                          setDragOverFrame(null);
                        }}
                        onDragEnd={() => {
                          setDragFromFrame(null);
                          setDragOverFrame(null);
                        }}
                        onClick={(e) => {
                          if (e.shiftKey) {
                            // Range select from selectedFrame to fIndex
                            const start = Math.min(selectedFrame, fIndex);
                            const end = Math.max(selectedFrame, fIndex);
                            const newSet = new Set(selectedFrames);
                            for (let i = start; i <= end; i++) {
                              newSet.add(i);
                            }
                            setSelectedFrames(newSet);
                          } else if (e.ctrlKey || e.metaKey) {
                            // Toggle individual frame
                            const newSet = new Set(selectedFrames);
                            if (newSet.has(fIndex)) {
                              newSet.delete(fIndex);
                            } else {
                              newSet.add(fIndex);
                            }
                            setSelectedFrames(newSet);
                          } else {
                            // Normal click — clear selection, select frame
                            setSelectedFrames(new Set());
                            setSelectedFrame(fIndex);
                          }
                        }}
                      >
                        {fIndex + 1}
                        {groupColor && (
                          <div
                            className={`absolute bottom-0 left-1 right-1 h-1 rounded-t ${groupColor}`}
                            title={group?.name}
                          />
                        )}
                      </div>
                    );
                  })}
                </article>
                <article className={`flex items-center gap-3`}>
                  <div className={`border-r border-neutral-900 px-2`}>
                    <IconMovie size={24} />
                  </div>
                  <button
                    title="Add New Frame"
                    onClick={() => {
                      pushToHistory("Add frame");
                      const updated = addNewFrame(liveArtwork, selectedFrame);
                      setLiveArtwork(updated);
                      setSelectedFrame(selectedFrame + 1);
                      setHasChanged(true);
                    }}
                  >
                    <IconNewSection size={24} />
                  </button>
                  <button
                    title="Duplicate Frame"
                    className={`flex items-center gap-1 text-xs font-medium`}
                    onClick={() => {
                      pushToHistory("Duplicate frame");
                      const updated = duplicateFrame(
                        liveArtwork,
                        selectedFrame,
                      );
                      setLiveArtwork(updated);
                      setSelectedFrame(selectedFrame + 1);
                      setHasChanged(true);
                    }}
                  >
                    <IconCopy size={24} />
                  </button>
                  <button
                    title="Delete Frame"
                    onClick={() => {
                      if (liveArtwork.frames.length <= 1) return;
                      pushToHistory("Delete frame");
                      const updated = deleteFrame(liveArtwork, selectedFrame);
                      setLiveArtwork(updated);
                      if (selectedFrame >= updated.frames.length) {
                        setSelectedFrame(Math.max(selectedFrame - 1, 0));
                      }
                      setHasChanged(true);
                    }}
                  >
                    <IconTrash size={24} />
                  </button>

                  <FrameSettingsModal />
                </article>
              </article>

              {/* Multi-frame selection bar */}
              {selectedFrames.size > 0 && (
                <article className="px-2 py-1.5 flex items-center gap-2 bg-primary-600/10 border-b border-primary-600/30 text-xs">
                  <span className="text-primary-600 font-medium">
                    {selectedFrames.size} frame
                    {selectedFrames.size !== 1 ? "s" : ""} selected
                  </span>
                  <button
                    onClick={() => {
                      pushToHistory("Duplicate selected frames");
                      const updated = duplicateFrames(
                        liveArtwork,
                        Array.from(selectedFrames),
                      );
                      setLiveArtwork(updated);
                      setHasChanged(true);
                      setSelectedFrames(new Set());
                    }}
                    className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      if (liveArtwork.frames.length <= 1) return;
                      pushToHistory("Delete selected frames");
                      const updated = deleteFrames(
                        liveArtwork,
                        Array.from(selectedFrames),
                      );
                      setLiveArtwork(updated);
                      setHasChanged(true);
                      setSelectedFrames(new Set());
                      if (selectedFrame >= updated.frames.length) {
                        setSelectedFrame(
                          Math.max(updated.frames.length - 1, 0),
                        );
                      }
                    }}
                    className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                  >
                    Delete
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={batchTiming}
                      onChange={(e) =>
                        setBatchTiming(parseInt(e.target.value) || 100)
                      }
                      className="w-14 px-1 py-1 border border-neutral-300 rounded bg-neutral-50 text-xs focus:outline-none focus:border-primary-600"
                    />
                    <span className="text-neutral-500">ms</span>
                    <button
                      onClick={() => {
                        pushToHistory("Change timing for selected frames");
                        const updated = changeFramesTimingBatch(
                          liveArtwork,
                          Array.from(selectedFrames),
                          batchTiming,
                        );
                        setLiveArtwork(updated);
                        setHasChanged(true);
                      }}
                      className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded transition-colors"
                    >
                      Set
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedFrames(new Set())}
                    className="ml-auto px-2 py-1 text-neutral-500 hover:bg-neutral-200 rounded transition-colors"
                  >
                    Clear
                  </button>
                </article>
              )}

              {/* Layer Rows */}
              <article
                className={`flex-grow p-2 w-full min-w-fit overflow-y-auto overflow-x-hidden z-10`}
              >
                {liveArtwork.layers.map((layer, lIndex) => (
                  <LayerRow
                    key={layer.id}
                    lIndex={lIndex}
                    layer={layer}
                  />
                ))}
              </article>
            </section>

            <div
              className={`pointer-events-auto px-2 flex gap-3 border-t border-neutral-900`}
            >
              <button
                title={"Add New Layer"}
                className={`p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300`}
                onClick={() => {
                  pushToHistory("Add layer");
                  const updated = addNewLayer(liveArtwork, selectedLayer);
                  setLiveArtwork(updated);
                  setHasChanged(true);
                }}
              >
                <IconNewSection size={24} />
              </button>

              <button
                title="Duplicate Layer"
                disabled={selectedLayer > liveArtwork.layers.length - 1}
                className={`${
                  selectedLayer > liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                } p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300`}
                onClick={() => {
                  if (selectedLayer > liveArtwork.layers.length - 1) return;
                  pushToHistory("Duplicate layer");
                  const updated = duplicateLayer(liveArtwork, selectedLayer);
                  setSelectedLayer(selectedLayer + 1);
                  setLiveArtwork(updated);
                  setHasChanged(true);
                }}
              >
                <IconCopy size={24} />
              </button>

              <button
                title="Move Layer Up"
                disabled={
                  selectedLayer === 0 ||
                  selectedLayer > liveArtwork.layers.length - 1
                }
                className={`${
                  selectedLayer === 0 ||
                  selectedLayer > liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                } p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300`}
                onClick={() => {
                  if (
                    selectedLayer === 0 ||
                    selectedLayer > liveArtwork.layers.length - 1
                  )
                    return;
                  pushToHistory("Move layer up");
                  const updated = moveLayerUp(liveArtwork, selectedLayer);
                  setSelectedLayer(selectedLayer - 1);
                  setLiveArtwork(updated);
                  setHasChanged(true);
                }}
              >
                <IconSquareArrowUp size={24} />
              </button>

              <button
                title="Move Layer Down"
                disabled={selectedLayer >= liveArtwork.layers.length - 1}
                className={`${
                  selectedLayer >= liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                } p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300`}
                onClick={() => {
                  if (selectedLayer >= liveArtwork.layers.length - 1) return;
                  pushToHistory("Move layer down");
                  const updated = moveLayerDown(liveArtwork, selectedLayer);
                  setSelectedLayer(selectedLayer + 1);
                  setLiveArtwork(updated);
                  setHasChanged(true);
                }}
              >
                <IconSquareArrowDown size={24} />
              </button>
            </div>
          </div>
        </article>

        {/* Open / Close Controls */}
        <article
          className={`pointer-events-auto cursor-pointer px-2 grid place-content-center w-10 ${
            openControls
              ? "bg-primary-600 hover:bg-primary-700 text-neutral-100"
              : "bg-neutral-100 hover:bg-neutral-300 text-neutral-900"
          } rounded-tl-full lg:rounded-2xl transition-all duration-300`}
          onClick={() => setOpenControls(!openControls)}
        >
          <IconLayersSubtract size={24} />
        </article>
      </section>
    );
  },
);

LayerControl.displayName = "LayerControl";

export default LayerControl;
