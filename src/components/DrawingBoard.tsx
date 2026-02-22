"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

import { Artwork } from "@/types/canvas";

import useArtStore from "@/utils/Zustand";
import { checkForArtwork, saveArtwork } from "@/utils/IndexedDB";
import { createNewArtwork } from "@/utils/General";
import { NewArtwork } from "@/utils/NewArtwork";
import { PreviewWindow } from "@/components/PreviewWindow";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const LiveDrawingArea = dynamic(() => import("@/components/LiveDrawingArea"), {
  ssr: false,
});

const LayerControl = dynamic(() => import("@/components/LayerControl"), {
  ssr: false,
});

const AnimationControl = dynamic(
  () => import("@/components/AnimationControl"),
  {
    ssr: false,
  },
);

export const DrawingBoard = ({ className = "" }: { className: string }) => {
  useKeyboardShortcuts();
  const [isLoading, setIsLoading] = useState(true);

  // Zustand - use granular selectors
  const keyIdentifier = useArtStore((s) => s.keyIdentifier);
  const setKeyIdentifier = useArtStore((s) => s.setKeyIdentifier);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const hasChanged = useArtStore((s) => s.hasChanged);
  const setHasChanged = useArtStore((s) => s.setHasChanged);
  const setIsSaving = useArtStore((s) => s.setIsSaving);
  const reset = useArtStore((s) => s.reset);

  const firstRun = useRef(true);

  useEffect(() => {
    const rehydrationCheck = setInterval(() => {
      if (keyIdentifier && firstRun.current) {
        checkForArtwork(keyIdentifier)
          .then((data: Artwork | undefined) => {
            if (data) {
              setLiveArtwork(data);
            } else {
              createNewArtwork({
                keyIdentifier,
                setKeyIdentifier,
                reset,
              }).then((data) => {
                setLiveArtwork(data);
              });
            }
          })
          .finally(() => {
            setIsLoading(false);
            firstRun.current = false;
          });
      }
    }, 100);

    return () => clearInterval(rehydrationCheck);
  }, [keyIdentifier, setKeyIdentifier, reset, setLiveArtwork]);

  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useArtStore.getState().hasChanged) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = 10 * 1000;

    const intervalId = setInterval(() => {
      if (hasChanged) {
        setIsSaving(true);
        saveArtwork(liveArtwork).then(() => {
          setTimeout(() => {
            setIsSaving(false);
            setHasChanged(false);
          }, 3000);
        });
      }
    }, saveInterval);

    return () => clearInterval(intervalId);
  }, [hasChanged, liveArtwork, setIsSaving, setHasChanged]);

  useEffect(() => {
    setLiveArtwork({ ...NewArtwork });
  }, [setLiveArtwork]);

  // Derive liveLayers from liveArtwork
  const liveLayers = liveArtwork?.layers ?? [];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Live Area */}
      <LiveDrawingArea isLoading={isLoading} setIsLoading={setIsLoading} />

      {/* Preview Window */}
      {!isLoading && <PreviewWindow />}

      {!isLoading && (
        <section
          className={`pointer-events-none absolute bottom-0 lg:bottom-0 right-0 pl-4 flex flex-col items-end justify-end gap-3 w-full h-fit font-normal text-neutral-900`}
        >
          {/* Layer / Frame Control */}
          <LayerControl isLoading={isLoading} setIsLoading={setIsLoading} />

          {/* Animation Control */}
          <AnimationControl />
        </section>
      )}
    </div>
  );
};
