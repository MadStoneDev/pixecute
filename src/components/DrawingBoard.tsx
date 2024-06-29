"use client";

import React, { useEffect, useState } from "react";
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
      console.log(keyIdentifier);
      console.log(artwork);
      if (artwork) {
        setLiveArtwork(artwork);
        return true;
      }
      return false;
    };

    useEffect(() => {
      checkForArtwork()
        .then((data) => {
          console.log(data);
          if (!data) {
            setupArtworkInDexie().then(() => {
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
        {/* Live Area */}
        {!isLoading && (
          <LiveDrawingArea
            liveArtwork={liveArtwork}
            setLiveArtwork={setLiveArtwork}
          />
        )}

        {/* Layer / Frame Control */}
        <LayerControl liveArtwork={liveArtwork} />

        {/* Animation Control */}
        {/*<AnimationControl />*/}
      </div>
    );
  },
);
