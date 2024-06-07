"use client";

import { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CreateGrid from "@/utilities/CreateGrid";
import { generateRandomString, newArtwork } from "@/utilities/GeneralUtils";

import {
  resetArtworkHistoryInSession,
  resetArtworkInSession,
} from "@/utilities/LayerUtils";

export default function NewArtworkForm() {
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 16 });
  const [selectedBackground, setSelectedBackground] = useState(0);

  const grid = CreateGrid(4, 4);
  const backgroundLookup: { [key: number]: string } = {
    0: "transparent",
    1: "white",
    2: "black",
  };

  const router = useRouter();

  useEffect(() => {
    resetArtworkInSession();
    resetArtworkHistoryInSession();
    sessionStorage.removeItem("artworkObject");
  });

  return (
    <section
      className={`py-8 px-4 md:px-8 flex flex-col justify-center gap-6 lg:gap-10 h-full`}
    >
      {/* Canvas Size PX * PX */}
      <article>
        <h3 className={`text-sm md:text-lg font-medium text-primary-600`}>
          Size
        </h3>
        <div className={`pt-2 flex flex-col gap-2 max-w-[16rem]`}>
          <div className={`grid grid-cols-3 items-center w-full`}>
            <label
              htmlFor="width"
              className={`text-neutral-500 text-xs md:text-sm font-medium`}
            >
              Width:
            </label>
            <div className={`col-span-2 px-2 flex items-center gap-2 border`}>
              <input
                id={"width"}
                name={"width"}
                type={"number"}
                className={`px-2 py-1 focus:outline-0 w-full bg-transparent`}
                value={canvasSize.width.toString()}
                onChange={(event) => {
                  const filteredValue = event.target.value.replace(/\D+/g, "");
                  setCanvasSize({
                    ...canvasSize,
                    width: parseInt(filteredValue),
                  });
                }}
              />
              <span className={`opacity-50`}>px</span>
            </div>
          </div>

          <div className={`grid grid-cols-3 items-center w-full`}>
            <label
              htmlFor="height"
              className={`text-neutral-500 text-xs md:text-sm font-medium`}
            >
              Height:
            </label>
            <div className={`col-span-2 px-2 flex items-center gap-2 border`}>
              <input
                id={"height"}
                name={"height"}
                type={"number"}
                className={`px-2 py-1 focus:outline-0 w-full bg-transparent`}
                value={canvasSize.height.toString()}
                onChange={(event) => {
                  const filteredValue = event.target.value.replace(/\D+/g, "");
                  setCanvasSize({
                    ...canvasSize,
                    height: parseInt(filteredValue),
                  });
                }}
              />
              <span className={`opacity-50`}>px</span>
            </div>
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
                    <div
                      className={`absolute flex flex-col top-0 left-0 w-full h-full`}
                    >
                      {grid.map((row, rowIndex) => (
                        <div
                          key={`transparent-row-${rowIndex}`}
                          className={`flex w-full grow`}
                        >
                          {row.map((col, colIndex) => (
                            <div
                              key={`transparent-col-${colIndex}`}
                              className={`grow ${
                                (rowIndex + colIndex) % 2 === 0
                                  ? "bg-neutral-300"
                                  : "bg-neutral-600"
                              }`}
                            ></div>
                          ))}
                        </div>
                      ))}
                    </div>
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
        onClick={() => {
          const configEncoded = newArtwork({
            width: canvasSize.width,
            height: canvasSize.height,
            background: backgroundLookup[selectedBackground],
            randomKey: generateRandomString(10),
          });

          router.push(`/editor?new=${configEncoded}` as Route);
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
