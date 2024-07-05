"use client";

import React, { useCallback, useEffect } from "react";
import { useState } from "react";

import { Artwork, Layer } from "@/types/canvas";

import {
  IconEye,
  IconTrash,
  IconPencil,
  IconLockOpen,
  IconNewSection,
  IconLayersSubtract,
  IconCopy,
  IconSquareArrowUp,
  IconSquareArrowDown,
  IconLock,
  IconEyeOff,
  IconMovie,
  IconSettings2,
  IconSettings,
} from "@tabler/icons-react";

import useArtStore from "@/utils/Zustand";
import {
  addNewLayer,
  deleteLayer,
  duplicateLayer,
  lockLayer,
  moveLayerDown,
  moveLayerUp,
  toggleHideLayer,
  toggleLockLayer,
  unlockLayer,
} from "@/utils/CanvasLayers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { saveArtwork } from "@/utils/IndexedDB";

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
    name: "Delete Layer",
    icon: <IconTrash size={16} />,
  },
];

const LayerControl = React.memo(
  ({
    liveArtwork,
    setLiveArtwork,
    liveLayers,
    setLiveLayers,
  }: {
    liveArtwork: Artwork;
    setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
    liveLayers: Layer[];
    setLiveLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  }) => {
    // Hooks
    // States
    const [layerName, setLayerName] = useState<string>("");
    const [openControls, setOpenControls] = useState(false);
    const [hasChanged, setHasChanged] = useState<boolean>(false);
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

    const selectLater = useCallback((layerIndex: number) => {
      setSelectedLayer(layerIndex);
    }, []);

    useEffect(() => {
      let intervalId = setInterval(() => {
        checkAndSave().then();
      }, saveInterval);

      const checkAndSave = async () => {
        if (hasChanged) {
          setIsSaving(true);
          await saveArtwork(liveArtwork);

          setTimeout(() => {
            setIsSaving(false);
          }, 3000);

          setHasChanged(false);
        }
      };

      return () => clearInterval(intervalId);
    }, []);

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
                {/* Layer Controls - Lock, Visibility, Delete */}
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
                  {Object.keys(liveArtwork.frames).map((frame, fIndex) => (
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
                  <button className={``}>
                    <IconNewSection size={24} />
                  </button>
                  <button
                    className={`flex items-center gap-1 text-xs font-medium`}
                  >
                    <IconCopy size={24} />
                  </button>
                  <button className={``}>
                    <IconSettings size={24} />
                  </button>
                </article>
              </article>

              {/* Wrapper for Scrolling */}
              <article
                className={`flex-grow p-2 w-full min-w-fit overflow-y-auto overflow-x-hidden z-10`}
              >
                {/* Layer Rows */}
                {liveArtwork.layers.map((layer, lIndex) => (
                  <div
                    key={`layer-${lIndex}`}
                    className={`cursor-pointer relative py-2 flex-grow flex flex-row ${
                      lIndex === selectedLayer
                        ? "bg-primary-600 text-primary-600"
                        : "hover:bg-primary-600/10"
                    } border-b border-neutral-300/60 transition-all duration-300`}
                    onClick={() => selectLater(lIndex)}
                  >
                    {/* Layer Controls - Lock, Visibility, Delete */}
                    <div
                      className={`cursor-pointer px-2 grid place-content-center w-8 ${
                        lIndex === selectedLayer
                          ? "text-neutral-100"
                          : "text-neutral-900"
                      } transition-all duration-300`}
                      onClick={() => {
                        const updatedArtwork = { ...liveArtwork };
                        toggleLockLayer({
                          artwork: updatedArtwork,
                          selectedLayer: lIndex,
                        });
                        setLiveArtwork(updatedArtwork);
                        setLiveLayers(updatedArtwork.layers);
                        setHasChanged(true);
                      }}
                    >
                      {layer.locked ? (
                        <IconLock size={16} />
                      ) : (
                        <IconLockOpen size={16} />
                      )}
                    </div>
                    <div
                      className={`cursor-pointer px-2 grid place-content-center w-8 ${
                        lIndex === selectedLayer
                          ? "text-neutral-100"
                          : "text-neutral-900"
                      } transition-all duration-300`}
                      onClick={() => {
                        const updatedArtwork = { ...liveArtwork };
                        toggleHideLayer({
                          artwork: updatedArtwork,
                          selectedLayer: lIndex,
                        });
                        setLiveArtwork(updatedArtwork);
                        setLiveLayers(updatedArtwork.layers);
                        setHasChanged(true);
                      }}
                    >
                      {layer.visible ? (
                        <IconEye size={16} />
                      ) : (
                        <IconEyeOff size={16} />
                      )}
                    </div>
                    <div
                      className={`cursor-pointer px-2 grid place-content-center w-8 border-r border-neutral-300/60 ${
                        lIndex === selectedLayer
                          ? "text-neutral-100"
                          : "text-neutral-900"
                      } transition-all duration-300`}
                      onClick={() => {
                        if (liveArtwork.layers.length === 1) return;
                        const updatedArtwork = { ...liveArtwork };
                        const currentLayer = selectedLayer;
                        deleteLayer({
                          artwork: updatedArtwork,
                          selectedLayer: lIndex,
                        });

                        setLiveArtwork(updatedArtwork);

                        if (selectedLayer >= updatedArtwork.layers.length) {
                          setSelectedLayer(Math.max(selectedLayer - 1, 0));
                        } else {
                          setSelectedLayer(currentLayer);
                        }

                        setLiveLayers(updatedArtwork.layers);
                        setHasChanged(true);
                      }}
                    >
                      <IconTrash size={16} />
                    </div>

                    {/* Layer Name and Edit Button */}
                    <span
                      className={`px-2 flex justify-between items-center w-40 border-x border-neutral-900 text-sm ${
                        lIndex === selectedLayer
                          ? "text-neutral-100"
                          : "text-neutral-900"
                      } transition-all duration-300`}
                    >
                      <span
                        className={`whitespace-nowrap ${
                          lIndex === selectedLayer
                            ? "font-bold text-neutral-100"
                            : "text-neutral-900"
                        } transition-all duration-300`}
                      >
                        {layer.name.slice(0, 15)}
                        {layer.name.length > 15 ? "..." : ""}
                      </span>

                      <Sheet>
                        <SheetTrigger onClick={() => setLayerName(layer.name)}>
                          <IconPencil size={20} />
                        </SheetTrigger>

                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Layer Name</SheetTitle>
                            <SheetDescription>
                              Choose a name for this layer
                            </SheetDescription>
                          </SheetHeader>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="name" className="text-right">
                              Name
                            </label>
                            <input
                              id="name"
                              className={"col-span-3"}
                              value={layerName}
                              onChange={(event) => {
                                const regex = /^[\w()]*$/;
                                const value = event.target.value;
                                if (regex.test(value)) {
                                }
                                setLayerName(event.target.value);
                              }}
                            />
                          </div>
                          <SheetFooter>
                            <SheetClose asChild>
                              <Button variant={"secondary"}>Cancel</Button>
                            </SheetClose>
                            <SheetClose asChild>
                              <Button
                                type={"submit"}
                                onClick={() => {
                                  const updatedArtwork = { ...liveArtwork };
                                  updatedArtwork.layers[lIndex].name =
                                    layerName;
                                  setLiveArtwork(updatedArtwork);
                                  setLiveLayers(updatedArtwork.layers);
                                  setHasChanged(true);
                                }}
                              >
                                Save Changes
                              </Button>
                            </SheetClose>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    </span>

                    {/* Frame Columns */}
                    {Object.entries(layer.frames).map((frame, fIndex) => (
                      <div
                        key={`frame-indicator-${fIndex}`}
                        className={`grid place-content-center w-8 border-r border-neutral-300/60 text-sm text-center transition-all duration-300`}
                        onClick={() => setSelectedFrame(fIndex)}
                      >
                        <div
                          className={`w-3.5 h-3.5 border ${
                            fIndex === selectedFrame && lIndex === selectedLayer
                              ? "border-neutral-100 bg-neutral-100/30"
                              : "border-neutral-900"
                          } rounded-full transition-all duration-300`}
                        ></div>
                      </div>
                    ))}
                  </div>
                ))}
              </article>
            </section>

            <div
              className={`pointer-events-auto p-2 flex gap-3 border-t border-neutral-900`}
            >
              <button
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
                disabled={selectedLayer > liveArtwork.layers.length - 1}
                className={`${
                  selectedLayer > liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                }`}
                onClick={() => {
                  if (selectedLayer > liveArtwork.layers.length - 1) return;
                  const updatedArtwork = { ...liveArtwork };
                  duplicateLayer({ artwork: liveArtwork, selectedLayer });
                  setSelectedLayer(selectedLayer + 1);
                  setLiveArtwork(updatedArtwork);
                  setLiveLayers(updatedArtwork.layers);
                  setHasChanged(true);
                }}
              >
                <IconCopy size={24} />
              </button>

              <button
                disabled={
                  selectedLayer === 0 ||
                  selectedLayer > liveArtwork.layers.length - 1
                }
                className={`${
                  selectedLayer === 0 ||
                  selectedLayer > liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                }`}
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
                disabled={selectedLayer >= liveArtwork.layers.length - 1}
                className={`${
                  selectedLayer >= liveArtwork.layers.length - 1
                    ? "opacity-20"
                    : "cursor-pointer"
                }`}
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
