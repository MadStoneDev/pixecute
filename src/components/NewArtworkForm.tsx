"use client";

import { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { IconLock, IconLockOpen } from "@tabler/icons-react";
import useArtStore from "@/utils/Zustand";
import { generateKeyIdentifier } from "@/utils/IndexedDB";
import { createNewArtwork } from "@/utils/General";

export default function NewArtworkForm() {
  // Hooks
  const router = useRouter();

  // States
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [matchLocked, setMatchLocked] = useState(false);
  const [delayedMatchLocked, setDelayedMatchLocked] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("width");
  const [gridSize] = useState(3);

  // Zustand
  const {
    keyIdentifier,
    canvasSize,
    canvasBackground,
    setKeyIdentifier,
    setCanvasSize,
    setCanvasBackground,
    reset,
  } = useArtStore();

  // Refs
  const TransparentRef = useRef<HTMLCanvasElement>(null);

  const backgroundLookup: { [key: number]: string } = {
    0: "transparent",
    1: "white",
    2: "black",
  };

  useEffect(() => {
    if (matchLocked) {
      setTimeout(() => {
        setDelayedMatchLocked(matchLocked);
      }, 750);
    } else {
      setDelayedMatchLocked(matchLocked);
    }
  }, [matchLocked]);

  useEffect(() => {
    const getBackground: number | undefined = Object.keys(backgroundLookup)
      .map(Number)
      .find((key) => backgroundLookup[key] === canvasBackground);

    if (getBackground) {
      setSelectedBackground(getBackground);
    } else {
      setSelectedBackground(0);
      setCanvasBackground("transparent");
    }

    if (TransparentRef.current) {
      const ctx = TransparentRef.current.getContext("2d");
      let darker = true;

      if (ctx) {
        ctx.imageSmoothingEnabled = false;

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            if (darker) {
              ctx.fillStyle = "#bbb";
            } else {
              ctx.fillStyle = "#777";
            }

            darker = !darker;
            ctx.fillRect(row, col, 1, 1);
          }
        }
      }
    }
  }, []);

  return (
    <section
      className={`py-8 px-4 md:px-8 flex flex-col justify-center gap-6 lg:gap-10 h-full overflow-hidden`}
    >
      {/* Canvas Size PX * PX */}
      <article>
        <h3 className={`text-sm md:text-lg font-medium text-primary-600`}>
          Size
        </h3>
        <div className={`flex flex-row w-full gap-2`}>
          <div className={`flex flex-col gap-6`}>
            <div className={`grid grid-cols-3 items-center w-full z-10`}>
              <label
                htmlFor="width"
                className={`text-neutral-500 dark:text-neutral-400 text-xs md:text-sm font-medium`}
              >
                Width:
              </label>
              <div
                className={`col-span-2 px-2 flex items-center gap-2 border dark:border-neutral-600`}
              >
                <input
                  id={"width"}
                  name={"width"}
                  type={"number"}
                  className={`p-3 focus:outline-0 w-full bg-transparent`}
                  value={canvasSize.width.toString()}
                  onChange={(event) => {
                    const filteredValue = event.target.value.replace(
                      /([^0-9]\.)+/g,
                      "",
                    );

                    const newValue = parseInt(filteredValue);

                    setCanvasSize({
                      ...canvasSize,
                      width: newValue,
                    });

                    setLastUpdated("width");
                  }}
                  onBlur={(event) => {
                    if (canvasSize.width < 1 || event.target.value === "") {
                      setCanvasSize({
                        ...canvasSize,
                        width: 1,
                      });
                    }

                    const filteredValue = event.target.value.replace(
                      /([^0-9]\.)+/g,
                      "",
                    );

                    const newValue = parseInt(filteredValue);

                    if (matchLocked) {
                      setCanvasSize({
                        ...canvasSize,
                        height: newValue,
                      });
                    }
                  }}
                />
                <span className={`opacity-50`}>px</span>
              </div>
            </div>

            <div className={`grid grid-cols-3 items-center w-full z-10`}>
              <label
                htmlFor="height"
                className={`text-neutral-500 dark:text-neutral-400 text-xs md:text-sm font-medium`}
              >
                Height:
              </label>
              <div
                className={`col-span-2 px-2 flex items-center gap-2 border dark:border-neutral-600`}
              >
                <input
                  id={"height"}
                  name={"height"}
                  type={"number"}
                  className={`p-3 focus:outline-0 w-full bg-transparent`}
                  value={canvasSize.height.toString()}
                  onChange={(event) => {
                    const filteredValue = parseInt(
                      event.target.value.replace(/\D+/g, ""),
                    );
                    setCanvasSize({
                      ...canvasSize,
                      height: filteredValue,
                    });

                    setLastUpdated("height");
                  }}
                  onBlur={(event) => {
                    if (canvasSize.height < 1 || event.target.value === "") {
                      setCanvasSize({
                        ...canvasSize,
                        height: 1,
                      });
                    }

                    const filteredValue = event.target.value.replace(
                      /([^0-9]\.)+/g,
                      "",
                    );

                    const newValue = parseInt(filteredValue);

                    if (matchLocked) {
                      setCanvasSize({
                        ...canvasSize,
                        width: newValue,
                      });
                    }
                  }}
                />
                <span className={`opacity-50`}>px</span>
              </div>
            </div>
          </div>

          <div
            className={`relative cursor-pointer py-5 flex flex-col gap-3 w-4 ${
              matchLocked ? "opacity-100" : "opacity-100"
            } transition-all duration-300`}
          >
            {/* Top Line */}
            <div
              className={`flex-grow border-t-2 border-r-2 border-neutral-700 dark:border-neutral-300 rounded-tr-lg transition-all duration-300`}
            ></div>
            <div
              onClick={() => {
                const currentStatus = matchLocked;
                let dominatingDimension = canvasSize.width;
                setMatchLocked(!currentStatus);

                if (!currentStatus) {
                  if (lastUpdated === "width") {
                    dominatingDimension = canvasSize.width;
                    setCanvasSize({
                      ...canvasSize,
                      height: dominatingDimension,
                    });
                  } else {
                    dominatingDimension = canvasSize.height;
                    setCanvasSize({
                      ...canvasSize,
                      width: dominatingDimension,
                    });
                  }
                }
              }}
            >
              {delayedMatchLocked ? (
                <IconLock size={20} className={`ml-[0.2rem]`} />
              ) : (
                <IconLockOpen size={20} className={`ml-[0.2rem]`} />
              )}
            </div>
            {/* Bottom Line */}
            <div
              className={`flex-grow border-b-2 border-r-2 border-neutral-700 dark:border-neutral-300 rounded-br-lg transition-all duration-300`}
            ></div>
            <div
              className={`pointer-events-none absolute top-1/2 left-3/4 -translate-y-1/2 -translate-x-1/2 ${
                matchLocked ? "scale-0" : "scale-1"
              } aspect-square rounded-full bg-neutral-800/70`}
              style={{
                height: "90%",
                transition: "all 1s ease-in-out",
              }}
            ></div>
          </div>
        </div>
      </article>

      {/* Background: transparent, white, black */}
      <article className={`flex flex-col gap-2`}>
        <div className={`text-sm md:text-lg font-medium text-primary-600`}>
          Background
          <div
            className={`mt-2 flex flex-col lg:grid md:grid-cols-3 gap-3 items-between text-center`}
          >
            {backgrounds.map((background, index) => (
              <div
                key={`backgrounds-selector-${index}`}
                className={`group cursor-pointer p-1.5 md:p-2 flex flex-row lg:flex-col items-center gap-2 border border-transparent ${
                  selectedBackground === index
                    ? "bg-primary-600 shadow-xl text-neutral-100 shadow-neutral-400 dark:shadow-black opacity-100"
                    : "hover:border-primary-600 text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 hover:dark:text-neutral-300 hover:shadow-xl hover:shadow-neutral-400 hover:dark:shadow-black opacity-90 hover:opacity-100"
                } shadow-neutral-200 dark:shadow-black md:rounded-xl text-xs transition-all duration-300`}
                onClick={() => {
                  setSelectedBackground(index);
                  setCanvasBackground(backgroundLookup[index]);
                }}
              >
                <div
                  className={`relative w-full max-w-10 md:max-w-12 lg:max-w-16 ${
                    background.colour
                  } ${
                    selectedBackground === index
                      ? "shadow-xl shadow-neutral-900/30"
                      : "shadow-lg shadow-neutral-900/10"
                  }`}
                  style={{
                    aspectRatio: 1,
                  }}
                >
                  {background.name === "transparent" && (
                    <canvas
                      ref={TransparentRef}
                      width={3}
                      height={3}
                      className={`w-full h-full bg-neutral-900`}
                      style={{
                        imageRendering: "pixelated",
                      }}
                    ></canvas>
                  )}
                </div>
                <p className={`text-xs capitalize`}>{background.name}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
      <button
        className={`py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-primary-600 text-neutral-100 dark:text-neutral-900 font-semibold text-sm md:text-base transition-all duration-300`}
        onClick={async () => {
          const newKey = await generateKeyIdentifier();
          await createNewArtwork({
            keyIdentifier: newKey,
            setKeyIdentifier,
            reset,
          });

          router.push(`/editor` as Route);
        }}
      >
        Start Creating
      </button>
    </section>
  );
}

const backgrounds = [
  { name: "transparent", colour: "bg-transparent" },
  { name: "white", colour: "bg-white" },
  { name: "black", colour: "bg-black" },
];
