"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

import { Artwork, Layer } from "@/types/canvas";

import useArtStore from "@/utils/Zustand";
import { checkForArtwork, saveArtwork } from "@/utils/IndexedDB";
import { createNewArtwork } from "@/utils/General";
import { NewArtwork } from "@/utils/NewArtwork";
import { PreviewWindow } from "@/components/PreviewWindow";

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
  // States
  const [liveArtwork, setLiveArtwork] = useState<Artwork>(NewArtwork);
  const [liveLayers, setLiveLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);

  // Zustand
  const { keyIdentifier, setKeyIdentifier, setIsSaving, reset } = useArtStore();

  // Refs
  const firstRun = useRef(true);

  useEffect(() => {
    const rehydrationCheck = setInterval(() => {
      if (keyIdentifier && firstRun.current) {
        checkForArtwork(keyIdentifier)
          .then((data: Artwork | undefined) => {
            if (data) {
              setLiveArtwork(data);
              setLiveLayers(data.layers);
            } else {
              createNewArtwork({
                keyIdentifier,
                setKeyIdentifier,
                reset,
              }).then((data) => {
                setLiveArtwork(data);
                setLiveLayers(data.layers);
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
  }, [keyIdentifier, setKeyIdentifier, reset]);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = 10 * 1000;

    let intervalId = setInterval(() => {
      checkAndSave().then();
    }, saveInterval);

    const checkAndSave = async () => {
      if (hasChanged) {
        setIsSaving(true);
        await saveArtwork(liveArtwork);

        setTimeout(() => {
          setIsSaving(false);
          setHasChanged(false);
        }, 3000);
      }
    };

    return () => clearInterval(intervalId);
  }, [hasChanged, liveArtwork, setIsSaving]);

  useEffect(() => {
    const useArtwork = NewArtwork;
    setLiveArtwork(useArtwork);
    setLiveLayers(useArtwork.layers);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Live Area */}
      <LiveDrawingArea
        liveArtwork={liveArtwork}
        setLiveArtwork={setLiveArtwork}
        liveLayers={liveLayers}
        setLiveLayers={setLiveLayers}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setHasChanged={setHasChanged}
      />

      {/* Preview Window */}
      {!isLoading && (
        <PreviewWindow liveArtwork={liveArtwork} liveLayers={liveLayers} />
      )}

      {!isLoading && (
        <section
          className={`pointer-events-none absolute bottom-0 lg:bottom-0 right-0 pl-4 flex flex-col items-end justify-end gap-3 w-full h-fit font-normal text-neutral-900`}
        >
          {/* Layer / Frame Control */}
          <LayerControl
            liveArtwork={liveArtwork}
            setLiveArtwork={setLiveArtwork}
            setLiveLayers={setLiveLayers}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setHasChanged={setHasChanged}
          />

          {/* Animation Control */}
          <AnimationControl
            liveArtwork={liveArtwork}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </section>
      )}
    </div>
  );
};
