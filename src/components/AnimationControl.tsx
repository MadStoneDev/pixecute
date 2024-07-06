"use client";

import { useEffect, useRef, useState } from "react";

import { Artwork } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";

import {
  IconRefresh,
  IconSquareChevronLeftFilled,
  IconSquareChevronRightFilled,
  IconSquareChevronsLeftFilled,
  IconSquareChevronsRightFilled,
  IconSquareFilled,
  IconTriangleFilled,
} from "@tabler/icons-react";

const ANIMATION_TOOLS = [
  { name: "Loop", icon: <IconRefresh size={24} /> },
  {
    name: "Previous Set",
    icon: <IconSquareChevronsLeftFilled size={24} />,
  },
  {
    name: "Previous Frame",
    icon: <IconSquareChevronLeftFilled size={24} />,
  },
  {
    name: "Play",
    icon: <IconTriangleFilled size={20} className={`rotate-90`} />,
    toggleIcon: <IconSquareFilled size={18} />,
  },
  {
    name: "Next Frame",
    icon: <IconSquareChevronRightFilled size={24} />,
  },
  {
    name: "Next Set",
    icon: <IconSquareChevronsRightFilled size={24} />,
  },
];

const AnimationControl = ({ liveArtwork }: { liveArtwork: Artwork }) => {
  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Zustand
  const { selectedFrame, setSelectedFrame } = useArtStore();

  // Refs
  const frameStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const playAnimation = (time: number) => {
    if (!isPlaying) return;

    if (!frameStartTimeRef.current) {
      frameStartTimeRef.current = time;
    }

    const frameDuration = liveArtwork.frames[selectedFrame];
    const elapsedTime = time - frameStartTimeRef.current;

    if (elapsedTime >= frameDuration) {
      frameStartTimeRef.current = time;

      setSelectedFrame((prevFrame) => {
        const nextFrame = prevFrame + 1;
        if (!isLooping && nextFrame >= liveArtwork.frames.length) {
          handlePause();
          return prevFrame;
        }

        return (prevFrame + 1) % liveArtwork.frames.length;
      });
    }

    animationFrameRef.current = window.requestAnimationFrame(playAnimation);
  };

  const handlePlay = () => {
    console.log(isPlaying);
    if (!isPlaying) {
      setIsPlaying(true);
      frameStartTimeRef.current = performance.now();
      animationFrameRef.current = window.requestAnimationFrame(playAnimation);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = window.requestAnimationFrame(playAnimation);
    }
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <section
      className={`pointer-events-none flex flex-col items-center gap-2 w-10 rounded-2xl text-neutral-900`}
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
          className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl transition-all duration-300 ${
            (tool.name === "Previous Set" && selectedFrame === 0) ||
            (tool.name === "Previous Frame" && selectedFrame === 0) ||
            (tool.name === "Next Frame" &&
              selectedFrame === liveArtwork.frames.length - 1) ||
            (tool.name === "Next Set" &&
              selectedFrame === liveArtwork.frames.length - 1)
              ? "bg-neutral-500 text-neutral-700"
              : "bg-neutral-100 hover:bg-primary-600 hover:text-neutral-100"
          } ${
            tool.name === "Loop" && isLooping
              ? "bg-primary-600 text-neutral-100"
              : ""
          }`}
          onClick={() => {
            if (tool.name === "Loop") {
              setIsLooping(!isLooping);
              setIsPlaying(false);
            } else if (tool.name === "Previous Set") {
              handlePause();
              setSelectedFrame(0);
            } else if (tool.name === "Previous Frame") {
              handlePause();
              setSelectedFrame(selectedFrame - 1);
            } else if (tool.name === "Next Frame") {
              handlePause();
              setSelectedFrame(selectedFrame + 1);
            } else if (tool.name === "Next Set") {
              handlePause();
              setSelectedFrame(liveArtwork.frames.length - 1);
            } else if (tool.name === "Play") {
              if (!isPlaying) {
                handlePlay();
                console.log("Playing");
              } else {
                handlePause();
                console.log("Paused");
              }
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
