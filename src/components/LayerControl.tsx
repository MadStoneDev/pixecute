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
  IconGridDots,
} from "@tabler/icons-react";
import { DropIndicator } from "@/components/DropIndicator";

const Dummy_Artwork: Artwork = {
  keyIdentifier: "F4S7J3h",
  layers: [
    {
      name: "Layer 1",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: new ImageData(1, 1),
        2: new ImageData(1, 1),
        3: new ImageData(1, 1),
        4: new ImageData(1, 1),
      },
    },
    {
      name: "This layer has long name",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: new ImageData(1, 1),
        2: new ImageData(1, 1),
        3: new ImageData(1, 1),
        4: new ImageData(1, 1),
      },
    },
    {
      name: "Layer 3",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 4",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 5",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 6",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
  ],
  frames: [100, 100, 100, 100],
};

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

export const LayerControl = React.memo(() => {
  const [openControls, setOpenControls] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(0);

  const [artworkLayers, setArtworkLayers] = useState<Layer[]>(
    Dummy_Artwork.layers,
  );

  const toggleControls = useCallback(() => {
    setOpenControls(!openControls);
  }, [openControls]);

  const selectLater = useCallback((layerIndex: number) => {
    setSelectedLayer(layerIndex);
  }, []);

  return (
    <section
      className={`absolute bottom-14 right-0 flex items-stretch justify-end gap-3 w-full h-fit max-h-[16.5rem] min-h-32 font-normal text-neutral-900`}
    >
      <article
        className={`py-2 flex items-stretch gap-2 w-full ${
          openControls ? "px-2 max-w-full" : "max-w-0"
        } bg-neutral-100 rounded-2xl transition-all duration-300 ease-in-out `}
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
              className={`pb-2 flex flex-row h-8 border-b border-neutral-900`}
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
              {Object.keys(Dummy_Artwork.frames).map((frame, fIndex) => (
                <div
                  key={`frame-indicator-${fIndex}`}
                  className={`grid items-center w-8 border-r border-neutral-300/60 text-sm text-center ${
                    fIndex === selectedFrame ? "font-bold text-primary-600" : ""
                  } transition-all duration-300`}
                >
                  {fIndex + 1}
                </div>
              ))}
            </article>

            {/* Wrapper for Scrolling */}
            <article
              className={`my-2 w-full min-w-fit overflow-y-auto overflow-x-hidden`}
            >
              {/* Layer Rows */}
              {artworkLayers.map((layer, lIndex) => (
                <div
                  key={`layer-${lIndex}`}
                  className={`cursor-pointer relative py-2 flex-grow flex flex-row ${
                    lIndex === selectedLayer
                      ? "bg-primary-600 text-neutral-100"
                      : "hover:bg-primary-600/20"
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
                    >
                      <div
                        className={`w-3.5 h-3.5 border ${
                          fIndex === selectedFrame && lIndex === selectedLayer
                            ? "border-primary-100"
                            : "border-neutral-900"
                        } rounded-full transition-all duration-300`}
                      ></div>
                    </div>
                  ))}
                </div>
              ))}
            </article>
          </section>

          <div className={`pt-2 flex gap-2 border-t border-neutral-900`}>
            <IconNewSection size={24} />
            <IconCopyPlus size={24} />
          </div>
        </div>
      </article>

      {/* Open / Close Controls */}
      <article
        className={`cursor-pointer px-2 grid place-content-center w-10 ${
          openControls
            ? "bg-primary-600 hover:bg-primary-700 text-neutral-100"
            : "bg-neutral-100 hover:bg-neutral-300 text-neutral-900"
        } rounded-2xl transition-all duration-300`}
        onClick={() => setOpenControls(!openControls)}
      >
        {openControls ? (
          <IconLayoutSidebarRightCollapseFilled size={28} />
        ) : (
          <IconLayoutSidebarRightExpandFilled size={28} />
        )}
      </article>
    </section>
  );
});
