"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

import { Artwork } from "@/types/canvas";
import { DummyArtwork } from "@/data/DummyArtwork";

import useArtStore from "@/utils/Zustand";
import { checkForArtwork, setupArtworkInDexie } from "@/utils/IndexedDB";

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
  const [liveArtwork, setLiveArtwork] = useState<Artwork>(DummyArtwork);
  const [isLoading, setIsLoading] = useState(true);

  // Zustand
  const {
    keyIdentifier,
    canvasSize,
    canvasBackground,
    selectedLayer,
    selectedFrame,
  } = useArtStore();

  useEffect(() => {
    checkForArtwork(keyIdentifier)
      .then((data: Artwork | false) => {
        if (data) {
          setLiveArtwork(data);
        } else {
          setupArtworkInDexie({
            keyIdentifier,
            canvasSize,
            canvasBackground,
            selectedLayer,
            selectedFrame,
          }).then((data) => {
            setLiveArtwork(data);
            setIsLoading(false);
          });
        }
      })
      .then(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoading && (
        <>
          {/* Live Area */}
          <LiveDrawingArea
            liveArtwork={liveArtwork}
            setLiveArtwork={setLiveArtwork}
          />

          {/* Layer / Frame Control */}
          <LayerControl liveArtwork={liveArtwork} />

          {/* Animation Control */}
          {/*<AnimationControl />*/}
        </>
      )}
    </div>
  );
};
