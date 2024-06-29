"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Artwork } from "@/types/canvas";
import { DummyArtwork } from "@/data/DummyArtwork";
import { getArtwork } from "@/utils/IndexedDB";
import useArtStore from "@/utils/Zustand";
import { createNewArtwork } from "@/utils/General";
import { regenerateCanvasLayers } from "@/utils/CanvasLayers";

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

export const DrawingBoard = React.memo(
  ({ className = "" }: { className: string }) => {
    // States
    const [liveArtwork, setLiveArtwork] = React.useState<Artwork>(DummyArtwork);

    // Zustand
    const {
      keyIdentifier,
      canvasSize,
      canvasBackground,
      selectedLayer,
      selectedFrame,
    } = useArtStore();

    const setupArtworkInDexie = async () => {
      const artwork = await createNewArtwork({
        width: canvasSize.width,
        height: canvasSize.height,
        background: canvasBackground,
        keyIdentifier: keyIdentifier,
      });

      const updatedLayers = regenerateCanvasLayers(
        artwork.layers,
        selectedFrame,
        canvasSize,
      );

      setLiveArtwork(artwork);
    };

    const checkForArtwork = async () => {
      const artwork = await getArtwork(keyIdentifier);
      if (artwork) {
        setLiveArtwork(artwork);
        return true;
      }
      return false;
    };

    useEffect(() => {
      checkForArtwork().then((data) => {
        if (!data) {
          setupArtworkInDexie().then();
        }
      });
    }, []);

    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Live Area */}
        <LiveDrawingArea
          liveArtwork={liveArtwork}
          setLiveArtwork={setLiveArtwork}
        />

        {/* Layer / Frame Control */}
        <LayerControl liveArtwork={liveArtwork} />

        {/* Animation Control */}
        {/*<AnimationControl />*/}
      </div>
    );
  },
);
