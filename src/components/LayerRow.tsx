// components/LayerRow.tsx
import React, { useCallback, useState, useRef, useEffect } from "react";

import useArtStore from "@/utils/Zustand";
import { Layer } from "@/types/canvas";
import { Button } from "@/components/ui/button";

import {
  deleteLayer,
  toggleHideLayer,
  toggleLockLayer,
} from "@/utils/CanvasLayers";

import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";

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
import { isFrameEmpty } from "@/utils/CanvasFrames";
import { Input } from "@/components/ui/input";
import { LayerSettingsModal } from "@/components/LayerSettingsModal";

export const LayerRow = ({
  lIndex,
  layer,
}: {
  lIndex: number;
  layer: Layer;
}) => {
  const [layerName, setLayerName] = useState<string>("");
  const [showLayerSettings, setShowLayerSettings] = useState(false);

  // Granular selectors
  const selectedLayer = useArtStore((s) => s.selectedLayer);
  const setSelectedLayer = useArtStore((s) => s.setSelectedLayer);
  const selectedFrame = useArtStore((s) => s.selectedFrame);
  const setSelectedFrame = useArtStore((s) => s.setSelectedFrame);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const setHasChanged = useArtStore((s) => s.setHasChanged);
  const pushToHistory = useArtStore((s) => s.pushToHistory);

  const selectLayer = useCallback(
    (layerIndex: number) => {
      setSelectedLayer(layerIndex);
    },
    [setSelectedLayer],
  );

  return (
    <div
      key={`layer-${lIndex}`}
      className={`cursor-pointer relative py-2 flex-grow flex flex-row ${
        lIndex === selectedLayer
          ? "bg-primary-600 text-primary-600"
          : "hover:bg-primary-600/10"
      } border-b border-neutral-300/60 transition-all duration-300`}
      onClick={() => selectLayer(lIndex)}
    >
      {/* Layer Controls - Lock, Visibility, Delete */}
      <div
        className={`cursor-pointer px-2 grid place-content-center w-8 ${
          lIndex === selectedLayer ? "text-neutral-100" : "text-neutral-900"
        } transition-all duration-300`}
        onClick={() => {
          pushToHistory("Toggle layer lock");
          const updated = toggleLockLayer(liveArtwork, lIndex);
          setLiveArtwork(updated);
          setHasChanged(true);
        }}
      >
        {layer.locked ? <IconLock size={16} /> : <IconLockOpen size={16} />}
      </div>
      <div
        className={`cursor-pointer px-2 grid place-content-center w-8 ${
          lIndex === selectedLayer ? "text-neutral-100" : "text-neutral-900"
        } transition-all duration-300`}
        onClick={() => {
          pushToHistory("Toggle layer visibility");
          const updated = toggleHideLayer(liveArtwork, lIndex);
          setLiveArtwork(updated);
          setHasChanged(true);
        }}
      >
        {layer.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
      </div>

      <div
        className={`cursor-pointer px-2 grid place-content-center w-8 ${
          lIndex === selectedLayer ? "text-neutral-100" : "text-neutral-900"
        } transition-all duration-300`}
        onClick={() => setShowLayerSettings(true)}
      >
        <IconSettings size={16} />
      </div>

      <div
        className={`cursor-pointer px-2 grid place-content-center w-8 ${
          lIndex === selectedLayer ? "text-neutral-100" : "text-neutral-900"
        } transition-all duration-300`}
        onClick={() => {
          if (liveArtwork.layers.length === 1) return;
          pushToHistory("Delete layer");
          const updated = deleteLayer(liveArtwork, lIndex);
          setLiveArtwork(updated);

          if (selectedLayer >= updated.layers.length) {
            setSelectedLayer(Math.max(selectedLayer - 1, 0));
          }

          setHasChanged(true);
        }}
      >
        <IconTrash size={16} />
      </div>

      {/* Layer Name and Edit Button */}
      <span
        className={`px-2 flex justify-between items-center w-40 border-x border-neutral-900 text-sm ${
          lIndex === selectedLayer ? "text-neutral-100" : "text-neutral-900"
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
              <SheetDescription>Choose a name for this layer</SheetDescription>
            </SheetHeader>
            <div className="py-4 grid grid-cols-4 items-center gap-x-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                id="name"
                className={"col-span-3"}
                value={layerName}
                onChange={(event) => {
                  setLayerName(event.target.value);
                }}
              />
            </div>
            <SheetFooter className={`mt-4`}>
              <SheetClose asChild>
                <Button
                  className={`border border-neutral-800 text-neutral-300`}
                >
                  Cancel
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  type={"submit"}
                  className={`bg-neutral-100 text-neutral-900`}
                  onClick={() => {
                    pushToHistory("Rename layer");
                    const newLayers = liveArtwork.layers.map((l, i) =>
                      i === lIndex ? { ...l, name: layerName } : l,
                    );
                    setLiveArtwork({ ...liveArtwork, layers: newLayers });
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

      {/* Frame Columns (0-indexed) — mini thumbnails */}
      {layer.frames.map((frame, fIndex) => (
        <FrameThumbnail
          key={`frame-thumb-${fIndex}`}
          frame={frame}
          fIndex={fIndex}
          isSelected={fIndex === selectedFrame && lIndex === selectedLayer}
          onClick={() => setSelectedFrame(fIndex)}
        />
      ))}

      <LayerSettingsModal
        layer={layer}
        layerIndex={lIndex}
        isOpen={showLayerSettings}
        setIsOpen={setShowLayerSettings}
      />
    </div>
  );
};

/** Tiny canvas thumbnail for a single frame in the timeline */
const FrameThumbnail = ({
  frame,
  fIndex,
  isSelected,
  onClick,
}: {
  frame: ImageData | null;
  fIndex: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frame) {
      // Scale frame into the tiny thumbnail
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = frame.width;
      tmpCanvas.height = frame.height;
      const tmpCtx = tmpCanvas.getContext("2d")!;
      tmpCtx.putImageData(frame, 0, 0);

      ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [frame]);

  const empty = !frame || isFrameEmpty(frame);

  return (
    <div
      className={`grid place-content-center w-8 border-r border-neutral-300/60 text-sm text-center transition-all duration-300 cursor-pointer`}
      onClick={onClick}
    >
      {empty ? (
        <div
          className={`w-3.5 h-3.5 border rounded-full ${
            isSelected
              ? "border-neutral-100 bg-neutral-100/30"
              : "border-neutral-900"
          } transition-all duration-300`}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={16}
          height={16}
          className={`w-5 h-5 border ${
            isSelected
              ? "border-neutral-100 shadow-sm shadow-neutral-100/50"
              : "border-neutral-400"
          } rounded-sm transition-all duration-300`}
          style={{ imageRendering: "pixelated" }}
        />
      )}
    </div>
  );
};
