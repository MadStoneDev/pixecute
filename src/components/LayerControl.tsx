"use client";

import { useState } from "react";

import {
  IconCopyPlus,
  IconEye,
  IconLayersSubtract,
  IconLayoutSidebarRightCollapseFilled,
  IconLayoutSidebarRightExpandFilled,
  IconLockOpen,
  IconMovie,
  IconNewSection,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { Artwork, Layer } from "@/types/canvas";

export const LayerControl = () => {
  const [openControls, setOpenControls] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(0);

  return (
    <section
      className={`absolute bottom-14 right-0 flex items-stretch justify-end gap-3 w-full h-fit max-h-[16.5rem] min-h-32 font-normal text-neutral-900`}
    >
      <article
        className={`p-2 flex items-stretch gap-2 w-full ${
          openControls ? "max-w-full" : "max-w-10"
        } bg-neutral-100 rounded-2xl transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className={`flex flex-col items-center justify-center`}>
          <div className={`pb-2 h-8`}>
            <IconMovie size={24} />
          </div>

          <div className={`flex-grow grid place-content-center`}>
            <IconLayersSubtract size={24} />
          </div>

          <div className={`pt-2 h-8`}></div>
        </div>

        {/* Populate with Data */}
        <section
          className={`flex flex-col items-stretch justify-center w-full`}
        >
          <article
            className={`pb-2 flex flex-row h-8 border-b border-neutral-900`}
          >
            {LAYER_CONTROLS.map((control, index) => (
              <div
                key={`layer-control-${index}`}
                className={`cursor-pointer px-2 grid place-content-center w-8 border-l border-neutral-300/60 transition-all duration-300`}
                onClick={() => setOpenControls(!openControls)}
              >
                {control.icon}
              </div>
            ))}
            <span
              className={`px-2 grid items-center w-40 border-x border-neutral-900 text-sm`}
            >
              Layer Name
            </span>
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

          <article
            className={`my-2 border-l border-neutral-300/60 overflow-y-auto`}
          >
            {Dummy_Artwork.layers.map((layer, lIndex) => (
              <div
                className={`cursor-pointer py-2 flex-grow flex flex-row ${
                  lIndex === selectedLayer
                    ? "bg-primary-600 text-neutral-100"
                    : "hover:bg-primary-600/20"
                } border-b border-neutral-300/60 transition-all duration-300`}
                onClick={() => setSelectedLayer(lIndex)}
              >
                {LAYER_CONTROLS.map((control, index) => (
                  <div
                    key={`layer-control-${index}`}
                    className={`cursor-pointer px-2 grid place-content-center w-8 ${
                      index === LAYER_CONTROLS.length - 1
                        ? ""
                        : "border-r border-neutral-300/60"
                    } transition-all duration-300`}
                    onClick={() => setOpenControls(!openControls)}
                  >
                    {control.icon}
                  </div>
                ))}
                <span
                  className={`px-2 flex justify-between items-center w-40 border-x border-neutral-900 text-sm transition-all duration-300`}
                >
                  <span
                    className={`whitespace-nowrap ${
                      lIndex === selectedLayer ? "font-bold" : ""
                    } transition-all duration-300`}
                  >
                    {layer.name.slice(0, 15)}
                    {layer.name.length > 15 ? "..." : ""}
                  </span>
                  <IconPencil size={16} />
                </span>
                {Object.entries(layer.frames).map((frame, fIndex) => (
                  <div
                    key={`frame-indicator-${fIndex}`}
                    className={`grid place-content-center w-8 border-r border-neutral-300/60 text-sm text-center transition-all duration-300`}
                  >
                    <div
                      className={`w-3.5 h-3.5 border border-neutral-900 rounded-full transition-all duration-300`}
                    ></div>
                  </div>
                ))}
              </div>
            ))}
          </article>

          <div className={`pt-2 flex gap-2 border-t border-neutral-900`}>
            <IconNewSection size={24} />
            <IconCopyPlus size={24} />
          </div>
        </section>
      </article>

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
};

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
        1: new ImageData(1, 1),
        2: new ImageData(1, 1),
        3: new ImageData(1, 1),
        4: new ImageData(1, 1),
      },
    },
    {
      name: "Layer 4",
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
      name: "Layer 5",
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
      name: "Layer 6",
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
