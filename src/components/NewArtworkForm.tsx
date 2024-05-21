"use client";

import { ChangeEvent, ChangeEventHandler, useState } from "react";

export default function NewArtworkForm() {
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 16 });
  const [formData, setFormData] = useState({
    width: 16,
    height: 16,
  });

  return (
    <section className={`p-10 flex flex-col justify-center h-full`}>
      {/* Canvas Size PX * PX */}
      <h3 className={`text-lg font-medium text-rose-600`}>Size</h3>
      <article className={`pt-2 pb-4 flex flex-col gap-2 max-w-[16rem]`}>
        <div className={`grid grid-cols-3 items-center w-full`}>
          <label
            htmlFor="width"
            className={`text-neutral-500 text-sm font-medium`}
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
            className={`text-neutral-500 text-sm font-medium`}
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
      </article>

      {/* Background: transparent, white, black */}
      <article className={`py-4 flex flex-col gap-2`}>
        <h3 className={`text-lg font-medium text-rose-600`}>
          Background
          <div className={`grid grid-cols-3 gap-2 text-center`}>
            <div className={`p-1 flex flex-col gap-2 text-xs`}>
              <div
                className={`w-full border`}
                style={{
                  aspectRatio: 1,
                }}
              ></div>
              Transparent
            </div>
            <div className={`p-1 flex flex-col gap-2 text-xs`}>
              <div
                className={`w-full border`}
                style={{
                  aspectRatio: 1,
                }}
              ></div>
              White
            </div>
            <div className={`p-1 flex flex-col gap-2 text-xs`}>
              <div
                className={`w-full border`}
                style={{
                  aspectRatio: 1,
                }}
              ></div>
              Black
            </div>
          </div>
        </h3>
        <button
          className={`py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-rose-600 text-neutral-100 dark:text-neutral-900 transition-all duration-300`}
        >
          Start Creating
        </button>
      </article>
    </section>
  );
}
