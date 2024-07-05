// LayerControls.tsx

import React, { useRef, useState } from "react";

import {
  IconEye,
  IconEyeOff,
  IconLayersSubtract,
  IconLayoutSidebarRightCollapseFilled,
  IconLayoutSidebarRightExpandFilled,
  IconLock,
  IconLockOpen,
  IconMovie,
  IconNewSection,
} from "@tabler/icons-react";
import { ArtworkObject } from "@/types/canvas";
import { isImageDataEmpty } from "@/utilities/ArtToolsUtils";

interface LayerControlsProps {
  artworkObject: ArtworkObject;
  activeLayer: number;
  setActiveLayer: (index: number) => void;
  activeFrame: number;
  setActiveFrame: (index: number) => void;
  handleNewLayer: () => void;
  handleNewFrame: () => void;
}

const LayerControls = ({
  artworkObject,
  activeLayer,
  setActiveLayer,
  activeFrame,
  setActiveFrame,
  handleNewLayer,
  handleNewFrame,
}: LayerControlsProps) => {
  // States
  const [openLayerControls, setOpenLayerControls] = useState(false);

  // Refs
  const ControlBlockRef = useRef<HTMLDivElement>(null);
  const LayerBlockRef = useRef<HTMLDivElement>(null);

  return (
    <article
      className={`pointer-events-none absolute bottom-0 right-0 flex flex-col w-full items-end z-50 overflow-hidden transition-all duration-300`}
    >
      {/* Open/Close Layer Controls */}
      <section
        className={`pointer-events-auto mb-2 p-1.5 bg-neutral-100 rounded-full transition-all duration-300`}
        onClick={() => setOpenLayerControls(!openLayerControls)}
      >
        {openLayerControls ? (
          <IconLayoutSidebarRightCollapseFilled size={30} />
        ) : (
          <IconLayoutSidebarRightExpandFilled size={30} />
        )}
      </section>

      {/* Bulk of the Controls */}
      <div
        className={`pointer-events-auto pt-2 relative flex flex-col items-stretch bg-neutral-100 rounded-2xl w-full whitespace-nowrap ${
          openLayerControls ? "max-w-full" : "max-w-[170px]"
        } overflow-hidden transition-all duration-300`}
      >
        <section
          ref={ControlBlockRef}
          className={`flex flex-row overflow-x-auto`}
        >
          {/* Side Icons */}
          <article
            className={`${
              openLayerControls ? "" : "hidden"
            } ml-2 pr-1 flex flex-col border-r border-secondary-300/60`}
          >
            <div
              className={`mb-2 flex items-center justify-center w-8 h-8 text-secondary-500 transition-all duration-300`}
            >
              <IconMovie size={24} />
            </div>

            <div
              className={`flex-grow flex items-center w-8 text-secondary-500 transition-all duration-300`}
            >
              <IconLayersSubtract size={24} />
            </div>
          </article>

          <article ref={LayerBlockRef} className={`mx-3 flex flex-col`}>
            {/* Header */}
            <article
              className={`flex flex-row border-b border-secondary-500 w-fit`}
            >
              {artworkObject?.frames.map((_, index) => (
                <div
                  key={`frame-label-${index}`}
                  className={`cursor-pointer mb-2 flex items-center justify-center w-10 h-8 hover:bg-primary-500 border-r border-neutral-300 font-sans text-center ${
                    index === activeFrame - 1
                      ? "text-primary-500 font-bold"
                      : "text-neutral-900"
                  } hover:text-neutral-100 transition-all duration-300`}
                  onClick={() => {
                    setActiveFrame(index + 1);
                    console.log(ControlBlockRef.current?.scrollWidth);
                  }}
                >
                  {index + 1}
                </div>
              ))}
              <div
                className={`px-2 cursor-pointer ${
                  openLayerControls ? "" : "absolute right-0 bg-neutral-100"
                } flex flex-row items-center justify-center gap-1 hover:bg-primary-500 h-8 font-sans text-center text-secondary-500 hover:text-neutral-100 transition-all duration-300`}
                onClick={() => {
                  handleNewFrame();

                  // Scroll to right-most
                  setTimeout(() => {
                    ControlBlockRef.current?.scrollTo({
                      left: LayerBlockRef.current?.offsetWidth! + 100,
                      behavior: "smooth",
                    });
                  }, 200);
                }}
              >
                <IconNewSection size={24} />
                {openLayerControls ? (
                  <span className={`text-sm font-medium`}>New Frame</span>
                ) : null}
              </div>
            </article>

            {/* Layer Table */}
            <article
              className={`pr-10 py-2 border-b border-secondary-500 max-h-[40vh] overflow-y-auto`}
            >
              <div className={`flex flex-col`}>
                {artworkObject?.layers.map((layer, lIndex) => (
                  <div
                    key={`layer-indicator-${lIndex}`}
                    className={`[&:not(:last-of-type)]:border-b [&:not(:last-of-type)]:border-secondary-300/50`}
                  >
                    <div
                      className={`mb-1 pointer-events-none flex items-center justify-start gap-3 h-7 text-sm text-secondary-500 w-full transition-all duration-300`}
                    >
                      <button
                        className={`pointer-events-auto grid place-content-center w-4`}
                        onClick={() => setActiveLayer(lIndex)}
                      >
                        {layer.locked ? (
                          <IconLock size={18} />
                        ) : (
                          <IconLockOpen size={18} />
                        )}
                      </button>
                      <button
                        className={`pointer-events-auto grid place-content-center w-4`}
                        onClick={() => setActiveLayer(lIndex)}
                      >
                        {layer.visible ? (
                          <IconEye size={20} />
                        ) : (
                          <IconEyeOff size={20} />
                        )}
                      </button>
                      <span
                        className={`pointer-events-auto cursor-pointer text-sm ${
                          lIndex === activeLayer
                            ? " text-primary-500 font-bold"
                            : "hover:text-primary-500"
                        } transition-all duration-300`}
                        onClick={() => setActiveLayer(lIndex)}
                      >
                        {layer.name}
                      </span>
                    </div>

                    <article className={`flex flex-row`}>
                      {Object.keys(layer.frames).map((_, fIndex) => (
                        <div
                          key={`frame-indicator-${fIndex}`}
                          className={`my-1 flex items-center justify-center border-r border-neutral-300 w-10 h-8 font-sans text-center text-secondary-500 ${
                            fIndex === activeFrame - 1 ? "font-bold" : ""
                          }`}
                          onClick={() => setActiveFrame(fIndex + 1)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full ${
                              layer.frames[fIndex + 1] === null ||
                              isImageDataEmpty(layer.frames[fIndex + 1]!)
                                ? fIndex + 1 === activeFrame &&
                                  lIndex === activeLayer
                                  ? "bg-transparent border-primary-500"
                                  : "bg-transparent border-neutral-900"
                                : fIndex + 1 === activeFrame &&
                                    lIndex === activeLayer
                                  ? "bg-primary-500 border-primary-500"
                                  : "bg-neutral-900 border-neutral-900"
                            } border`}
                          ></div>
                        </div>
                      ))}
                    </article>
                  </div>
                ))}
              </div>
            </article>
          </article>
        </section>

        <section>
          <div
            className={`pt-1 px-2 cursor-pointer inline-flex flex-row items-center justify-start gap-1 hover:bg-primary-500 w-fit h-8 font-sans text-center text-secondary-500 hover:text-neutral-100 transition-all duration-300`}
            onClick={handleNewLayer}
          >
            <IconNewSection size={24} className={``} />
            <span className={`mt-0.5 text-sm font-medium`}>New Layer</span>
          </div>
        </section>
      </div>
    </article>
  );
};

export default LayerControls;
