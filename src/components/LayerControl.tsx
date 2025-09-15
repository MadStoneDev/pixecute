// components/LayerControl.tsx

"use client";

import React, { useCallback, useEffect } from "react";
import { useState } from "react";

import useArtStore from "@/utils/Zustand";
import { Artwork, Layer } from "@/types/canvas";
import { saveArtwork } from "@/utils/IndexedDB";
import { LayerRow } from "@/components/LayerRow";
import { FrameSettingsModal } from "@/components/FrameSettingsModal";
import { addNewFrame, deleteFrame, duplicateFrame } from "@/utils/CanvasFrames";

import {
  addNewLayer,
  duplicateLayer,
  moveLayerDown,
  moveLayerUp,
} from "@/utils/CanvasLayers";

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

const LayerControl = React.memo(
  ({
    liveArtwork,
    setLiveArtwork,
    setLiveLayers,
    setHasChanged,
  }: {
    liveArtwork: Artwork;
    setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
    setLiveLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    // States
    const [openControls, setOpenControls] = useState(false);
    const [saveInterval, setSaveInterval] = useState<number>(10 * 1000);

    // Zustand
    const {
      selectedLayer,
      setSelectedLayer,
      selectedFrame,
      setSelectedFrame,
      setIsSaving,
    } = useArtStore();

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
    }, [selectedFrame, selectedLayer, saveInterval, checkAndSave, liveArtwork]);

    return (
      <section
        className={`pointer-events-none flex items-stretch justify-end gap-3 w-full max-h-56 lg:max-h-64 min-h-56 font-normal text-neutral-900`}
      >
        <article
          className={`pointer-events-auto flex items-stretch gap-2 w-full ${
            openControls ? "max-w-full" : "max-w-0"
          } bg-neutral-100 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out z-30`}
        >
          <div
            className={`flex flex-col items-stretch justify-start w-full overflow-hidden`}
          >
            {/* Populate with Data */}
            <section
              className={`flex-grow relative flex flex-col items-stretch justify-center w-full min-w-fit overflow-x-auto`}
            >
              {/* Header Row */}
              <article
                className={`px-2 py-2.5 flex flex-row border-b border-neutral-900 bg-neutral-400/50`}
              >
                {/* Layer Controls - Lock, Visibility, Settings, Delete */}
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

                {/* Layer Name */}
                <span
                  className={`px-2 grid items-center w-40 border-x border-neutral-900 text-sm`}
                >
                  Layer Name
                </span>

                <article className={`flex-grow flex flex-row items-center`}>
                  {/* Frame Columns */}
                  {Object.keys(liveArtwork.frames).map((_, fIndex) => (
                    <div
                      key={`frame-indicator-${fIndex}`}
                      className={`cursor-pointer grid items-center w-8 border-r border-neutral-300/60 text-sm text-center ${
                        fIndex === selectedFrame
                          ? "font-bold text-primary-600"
                          : ""
                      } transition-all duration-300`}
                      onClick={() => setSelectedFrame(fIndex)}
                    >
                      {fIndex + 1}
                    </div>
                  ))}
                </article>
                <article className={`flex items-center gap-3`}>
                  <div className={`border-r border-neutral-900 px-2`}>
                    <IconMovie size={24} />
                  </div>
                  <button
                    title="Add New Frame"
                    onClick={() => {
                      const updatedArtwork = { ...liveArtwork };
                      addNewFrame({ artwork: updatedArtwork, selectedFrame });
                      setLiveArtwork(updatedArtwork);
                      setLiveLayers(updatedArtwork.layers);
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
                      const updatedArtwork = {
                        ...liveArtwork,
                        frames: [...liveArtwork.frames],
                        layers: liveArtwork.layers.map((layer) => ({
                          ...layer,
                          frames: { ...layer.frames },
                        })),
                      };
                      duplicateFrame({
                        artwork: updatedArtwork,
                        selectedFrame,
                      });
                      setLiveArtwork(updatedArtwork);
                      setLiveLayers(updatedArtwork.layers);
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
                      const updatedArtwork = { ...liveArtwork };
                      deleteFrame({ artwork: updatedArtwork, selectedFrame });
                      setLiveArtwork(updatedArtwork);
                      setLiveLayers(updatedArtwork.layers);
                      if (selectedFrame >= updatedArtwork.frames.length) {
                        setSelectedFrame(Math.max(selectedFrame - 1, 0));
                      }
                      setHasChanged(true);
                    }}
                  >
                    <IconTrash size={24} />
                  </button>

                  {/* Frame Settings Modal */}
                  <FrameSettingsModal
                    liveArtwork={liveArtwork}
                    setLiveArtwork={setLiveArtwork}
                    setHasChanged={setHasChanged}
                  />
                </article>
              </article>

              {/* Wrapper for Scrolling */}
              <article
                className={`flex-grow p-2 w-full min-w-fit overflow-y-auto overflow-x-hidden z-10`}
              >
                {/* Layer Rows */}
                {liveArtwork.layers.map((layer, lIndex) => (
                  <LayerRow
                    key={`layer-row-${lIndex}`}
                    lIndex={lIndex}
                    layer={layer}
                    liveArtwork={liveArtwork}
                    setLiveArtwork={setLiveArtwork}
                    setLiveLayers={setLiveLayers}
                    setHasChanged={setHasChanged}
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
                  const updatedArtwork = { ...liveArtwork };
                  addNewLayer({ artwork: updatedArtwork, selectedLayer });
                  setLiveArtwork(updatedArtwork);
                  setLiveLayers(updatedArtwork.layers);
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
                  const updatedArtwork = { ...liveArtwork };
                  duplicateLayer({ artwork: updatedArtwork, selectedLayer });
                  setSelectedLayer(selectedLayer + 1);
                  setLiveArtwork(updatedArtwork);
                  setLiveLayers(updatedArtwork.layers);
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
                  const updatedArtwork = { ...liveArtwork };
                  moveLayerUp({ artwork: updatedArtwork, selectedLayer });
                  setSelectedLayer(selectedLayer - 1);
                  setLiveArtwork(updatedArtwork);
                  setLiveLayers(updatedArtwork.layers);
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
                  const updatedArtwork = { ...liveArtwork };
                  moveLayerDown({ artwork: updatedArtwork, selectedLayer });
                  setSelectedLayer(selectedLayer + 1);
                  setLiveArtwork(updatedArtwork);
                  setLiveLayers(updatedArtwork.layers);
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
  (prevProps, nextProps) => {
    return prevProps.liveArtwork === nextProps.liveArtwork;
  },
);

export default LayerControl;
