"use client";

import React, { useEffect, useRef, useState } from "react";

import { Artwork } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";

import {
  IconArrowsRightLeft,
  IconRefresh,
  IconSquareChevronLeftFilled,
  IconSquareChevronRightFilled,
  IconSquareChevronsLeftFilled,
  IconSquareChevronsRightFilled,
  IconSquareFilled,
  IconTriangleFilled,
} from "@tabler/icons-react";

const AnimationControl = ({
  liveArtwork,
  isLoading,
  setIsLoading,
}: {
  liveArtwork: Artwork;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isPingPong, setIsPingPong] = useState(false);

  // Zustand
  const { selectedFrame, setSelectedFrame } = useArtStore();

  // Refs
  const frameStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isReverseRef = useRef<boolean>(false);

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
        const nextFrame = isReverseRef.current ? prevFrame - 1 : prevFrame + 1;

        if (!isLooping) {
          if (
            (isReverseRef.current && nextFrame < 0) ||
            (!isReverseRef.current && nextFrame === liveArtwork.frames.length)
          ) {
            handlePause();
            if (isPingPong) {
              isReverseRef.current = !isReverseRef.current;
            }
            return prevFrame;
          } else {
            return nextFrame;
          }
        } else {
          if (isPingPong) {
            if (
              (isReverseRef.current && nextFrame === 0) ||
              (!isReverseRef.current &&
                nextFrame === liveArtwork.frames.length - 1)
            ) {
              isReverseRef.current = !isReverseRef.current;
            }
            return nextFrame;
          } else {
            return nextFrame % liveArtwork.frames.length;
          }
        }
      });
    }

    animationFrameRef.current = window.requestAnimationFrame(playAnimation);
  };

  const handlePlay = () => {
    if (!isPingPong) {
      isReverseRef.current = false;
    } else {
      if (selectedFrame === 0) {
        isReverseRef.current = false;
      } else if (selectedFrame === liveArtwork.frames.length - 1) {
        isReverseRef.current = true;
      }
    }

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
    // KEEP AS BACKUP IF WE WANT TO GO TO VERTICAL LAYOUT INSTEAD
    // <section
    //   className={`pointer-events-none flex flex-col items-center gap-2 w-10 rounded-2xl text-neutral-900`}
    // >
    // ^^ KEEP AS BACKUP IF WE WANT TO GO TO VERTICAL LAYOUT INSTEAD ^^

    <section
      className={`pointer-events-none self-center px-2 flex flex-row justify-center items-center gap-2 w-fit h-10 rounded-2xl text-neutral-900 bg-neutral-100 shadow-2xl shadow-neutral-900 z-50`}
    >
      {/* Previous Set */}
      <button
        disabled={selectedFrame === 0}
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          selectedFrame === 0
            ? "text-neutral-300"
            : "hover:bg-primary-600 hover:text-neutral-100"
        } transition-all duration-300`}
        onClick={() => {
          setSelectedFrame(0);
          handlePause();
        }}
      >
        <IconSquareChevronsLeftFilled size={22} />
      </button>

      {/* Previous Frame */}
      <button
        disabled={selectedFrame === 0}
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          selectedFrame === 0
            ? "text-neutral-300"
            : "hover:bg-primary-600 hover:text-neutral-100"
        }  transition-all duration-300`}
        onClick={() => {
          setSelectedFrame(selectedFrame - 1);
          handlePause();
        }}
      >
        <IconSquareChevronLeftFilled size={22} />
      </button>

      {/* Play */}
      <button
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          isPlaying ? "rotate-180" : "rotate-90"
        } transition-all duration-300`}
        onClick={() => {
          if (!isPlaying) {
            handlePlay();
          } else {
            handlePause();
          }
        }}
      >
        {isPlaying ? (
          <IconSquareFilled size={18} />
        ) : (
          <IconTriangleFilled size={20} />
        )}
      </button>

      {/* Next Frame */}
      <button
        disabled={selectedFrame === liveArtwork.frames.length - 1}
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          selectedFrame === liveArtwork.frames.length - 1
            ? "text-neutral-300"
            : "hover:bg-primary-600 hover:text-neutral-100"
        } transition-all duration-300`}
        onClick={() => {
          setSelectedFrame(selectedFrame + 1);
          handlePause();
        }}
      >
        <IconSquareChevronRightFilled size={22} />
      </button>

      {/* Next Set */}
      <button
        disabled={selectedFrame === liveArtwork.frames.length - 1}
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          selectedFrame === liveArtwork.frames.length - 1
            ? "text-neutral-300"
            : "hover:bg-primary-600 hover:text-neutral-100"
        } transition-all duration-300`}
        onClick={() => {
          setSelectedFrame(liveArtwork.frames.length - 1);
          handlePause();
        }}
      >
        <IconSquareChevronsRightFilled size={22} />
      </button>

      {/* Loop */}
      <button
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          isLooping
            ? "bg-primary-600/40 border-primary-600 text-primary-600"
            : ""
        } transition-all duration-300`}
        onClick={() => {
          setIsLooping(!isLooping);
        }}
      >
        <IconRefresh size={24} />
      </button>

      {/* Ping Pong */}
      <button
        className={`pointer-events-auto flex items-center justify-center w-8 aspect-square rounded-2xl border border-transparent ${
          isPingPong
            ? "bg-primary-600/40 border-primary-600 text-primary-600"
            : ""
        } transition-all duration-300`}
        onClick={() => {
          setIsPingPong(!isPingPong);

          if (!isPingPong) {
            isReverseRef.current = false;
          }
        }}
      >
        <IconArrowsRightLeft size={22} />
      </button>
    </section>
  );
};

export default AnimationControl;
