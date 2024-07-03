"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

import { Artwork } from "@/types/canvas";
import { DummyArtwork } from "@/data/DummyArtwork";

import useArtStore from "@/utils/Zustand";
import { checkForArtwork } from "@/utils/IndexedDB";
import { createNewArtwork } from "@/utils/General";
import { NewArtwork } from "@/utils/NewArtwork";

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
  const [isLoading, setIsLoading] = useState(true);

  // Zustand
  const { keyIdentifier, setKeyIdentifier, reset } = useArtStore();

  // Refs
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
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
  }, [keyIdentifier, setKeyIdentifier, reset]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoading && (
        <>
          {/* Live Area */}
          <LiveDrawingArea
            liveArtwork={liveArtwork}
            setLiveArtwork={setLiveArtwork}
          />

          <section
            className={`pointer-events-none absolute bottom-0 lg:bottom-2 right-0 pl-4 flex flex-col-reverse items-end justify-end gap-3 w-full h-fit font-normal text-neutral-900`}
          >
            {/* Layer / Frame Control */}
            <LayerControl liveArtwork={liveArtwork} />

            {/* Animation Control */}
            <AnimationControl />
          </section>
        </>
      )}
    </div>
  );
};
