"use client";

import React, { useCallback } from "react";
import { useState } from "react";

import { Artwork, Layer } from "@/types/canvas";
import { createEmptyFrame } from "@/utils/NewArtwork";

import {
  IconEye,
  IconTrash,
  IconPencil,
  IconCopyPlus,
  IconLockOpen,
  IconNewSection,
  IconLayoutSidebarRightCollapseFilled,
  IconLayoutSidebarRightExpandFilled,
  IconLayersSubtract,
} from "@tabler/icons-react";
import { DropIndicator } from "@/components/DropIndicator";
import { DummyArtwork } from "@/data/DummyArtwork";
import useArtStore from "@/utils/Zustand";

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

const LayerControl = React.memo(() => {
  // Hooks
  // States
  const [openControls, setOpenControls] = useState(false);

  // Zustand
  const { selectedLayer, setSelectedLayer, selectedFrame, setSelectedFrame } =
    useArtStore();

  const [artworkLayers, setArtworkLayers] = useState<Layer[]>(
    DummyArtwork.layers,
  );

  const toggleControls = useCallback(() => {
    setOpenControls(!openControls);
  }, [openControls]);

  const selectLater = useCallback((layerIndex: number) => {
    setSelectedLayer(layerIndex);
  }, []);

  return (
    <section
      className={`pointer-events-none absolute bottom-0 lg:bottom-2 right-0 pl-4 flex items-stretch justify-end gap-3 w-full h-fit max-h-48 lg:max-h-[16rem] min-h-10 font-normal text-neutral-900`}
    >
      <article
        className={`pointer-events-auto flex items-stretch gap-2 w-full ${
          openControls ? "max-w-full" : "max-w-0"
        } bg-neutral-100 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out `}
      >
        <div
          className={`flex flex-col items-stretch justify-center w-full overflow-hidden`}
        >
          {/* Populate with Data */}
          <section
            className={`relative flex flex-col items-stretch justify-center w-full min-w-fit overflow-x-auto`}
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

              {/* Frame Columns */}
              {Object.keys(DummyArtwork.frames).map((frame, fIndex) => (
                <div
                  key={`frame-indicator-${fIndex}`}
                  className={`cursor-pointer grid items-center w-8 border-r border-neutral-300/60 text-sm text-center ${
                    fIndex === selectedFrame ? "font-bold text-primary-600" : ""
                  } transition-all duration-300`}
                  onClick={() => setSelectedFrame(fIndex)}
                >
                  {fIndex + 1}
                </div>
              ))}
            </article>

            {/* Wrapper for Scrolling */}
            <article
              className={`p-2 w-full min-w-fit overflow-y-auto overflow-x-hidden`}
            >
              {/* Layer Rows */}
              {artworkLayers.map((layer, lIndex) => (
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
                  {LAYER_CONTROLS.map((control, index) => (
                    <div
                      key={`layer-control-${index}`}
                      className={`cursor-pointer px-2 grid place-content-center w-8 ${
                        index === LAYER_CONTROLS.length - 1
                          ? ""
                          : "border-r border-neutral-300/60"
                      } ${
                        lIndex === selectedLayer
                          ? "text-neutral-100"
                          : "text-neutral-900"
                      } transition-all duration-300`}
                      onClick={() => setOpenControls(!openControls)}
                    >
                      {control.icon}
                    </div>
                  ))}

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
                    <IconPencil size={16} />
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

          <div className={`p-2 flex gap-2 border-t border-neutral-900`}>
            <IconNewSection size={24} />
            <IconCopyPlus size={24} />
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
});

export default LayerControl;
