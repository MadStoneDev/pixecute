"use client";

import { useState } from "react";

import { Artwork } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";

import {
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled,
  IconPlayerTrackNextFilled,
  IconPlayerTrackPrevFilled,
} from "@tabler/icons-react";

const ANIMATION_TOOLS = [
  {
    name: "Previous Set",
    icon: <IconPlayerTrackPrevFilled size={18} />,
    toggleIcon: <IconPlayerStopFilled size={18} />,
  },
  {
    name: "Previous Frame",
    icon: <IconPlayerSkipBackFilled size={18} />,
  },
  {
    name: "Play",
    icon: <IconPlayerPlayFilled size={18} />,
  },
  {
    name: "Next Frame",
    icon: <IconPlayerSkipForwardFilled size={18} />,
  },
  {
    name: "Next Set",
    icon: <IconPlayerTrackNextFilled size={18} />,
  },
];

const AnimationControl = ({ liveArtwork }: { liveArtwork: Artwork }) => {
  // States
  const [isPlaying, setIsPlaying] = useState(false);

  // Zustand
  const { selectedFrame, setSelectedFrame } = useArtStore();

  return (
    <section
      className={`pointer-events-none flex flex-col items-end justify-end gap-1 w-10 rounded-2xl text-neutral-900 bg-neutral-100`}
    >
      {ANIMATION_TOOLS.map((tool, index) => (
        <button
          key={index}
          disabled={
            (tool.name === "Previous Set" && selectedFrame === 0) ||
            (tool.name === "Previous Frame" && selectedFrame === 0) ||
            (tool.name === "Next Frame" &&
              selectedFrame === liveArtwork.frames.length - 1) ||
            (tool.name === " Set" &&
              selectedFrame === liveArtwork.frames.length - 1)
          }
          className={`pointer-events-auto flex items-center justify-center w-10 aspect-square bg-neutral-100 hover:bg-primary-600 rounded-2xl transition-all duration-300 ${
            (tool.name === "Previous Set" && selectedFrame === 0) ||
            (tool.name === "Previous Frame" && selectedFrame === 0) ||
            (tool.name === "Next Frame" &&
              selectedFrame === liveArtwork.frames.length - 1) ||
            (tool.name === "Next Set" &&
              selectedFrame === liveArtwork.frames.length - 1)
              ? "opacity-30"
              : ""
          }`}
          onClick={() => {
            if (tool.name === "Previous Set") {
              setSelectedFrame(0);
            } else if (tool.name === "Previous Frame") {
              setSelectedFrame(selectedFrame - 1);
            } else if (tool.name === "Next Frame") {
              setSelectedFrame(selectedFrame + 1);
            } else if (tool.name === "Next Set") {
              setSelectedFrame(liveArtwork.frames.length - 1);
            } else if (tool.name === "Play") {
              setIsPlaying(!isPlaying);
            }
          }}
        >
          {isPlaying && tool.toggleIcon ? tool.toggleIcon : tool.icon}
        </button>
      ))}
    </section>
  );
};

export default AnimationControl;
