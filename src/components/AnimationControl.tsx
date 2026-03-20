"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import useArtStore from "@/utils/Zustand";
import { AnimationGroup } from "@/types/canvas";
import { AnimationGroupPanel } from "@/components/AnimationGroupPanel";

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

const AnimationControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isPingPong, setIsPingPong] = useState(false);
  const [activeGroup, setActiveGroup] = useState<AnimationGroup | null>(null);
  const [showGroupPanel, setShowGroupPanel] = useState(false);

  // Granular selectors
  const selectedFrame = useArtStore((s) => s.selectedFrame);
  const setSelectedFrame = useArtStore((s) => s.setSelectedFrame);
  const liveArtwork = useArtStore((s) => s.liveArtwork);

  const frameStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isReverseRef = useRef<boolean>(false);
  // Use ref to avoid stale closure in rAF callback
  const playAnimationRef = useRef<((time: number) => void) | null>(null);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Get the effective frame list (group frames or all frames)
  const activeGroupRef = useRef<AnimationGroup | null>(null);
  activeGroupRef.current = activeGroup;

  // Update the animation function ref each render to get latest state
  useEffect(() => {
    playAnimationRef.current = (time: number) => {
      if (!frameStartTimeRef.current) {
        frameStartTimeRef.current = time;
      }

      const frameDuration = liveArtwork.frames[selectedFrame];
      const elapsedTime = time - frameStartTimeRef.current;

      if (elapsedTime >= frameDuration) {
        frameStartTimeRef.current = time;

        const group = activeGroupRef.current;
        const frameList = group
          ? group.frameIndices
          : Array.from({ length: liveArtwork.frames.length }, (_, i) => i);
        const looping = group ? group.loop : isLooping;
        const pingPong = group ? group.pingPong : isPingPong;

        setSelectedFrame((prevFrame: number) => {
          const currentIdx = frameList.indexOf(prevFrame);
          if (currentIdx === -1) return frameList[0] ?? 0;

          const nextIdx = isReverseRef.current
            ? currentIdx - 1
            : currentIdx + 1;

          if (!looping) {
            if (nextIdx < 0 || nextIdx >= frameList.length) {
              handlePause();
              if (pingPong) {
                isReverseRef.current = !isReverseRef.current;
              }
              return prevFrame;
            }
            return frameList[nextIdx];
          } else {
            if (pingPong) {
              if (nextIdx <= 0 || nextIdx >= frameList.length - 1) {
                isReverseRef.current = !isReverseRef.current;
              }
              const clampedIdx = Math.max(
                0,
                Math.min(frameList.length - 1, nextIdx),
              );
              return frameList[clampedIdx];
            } else {
              return frameList[nextIdx % frameList.length];
            }
          }
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(
        (t) => playAnimationRef.current?.(t),
      );
    };
  }, [
    liveArtwork,
    selectedFrame,
    isLooping,
    isPingPong,
    activeGroup,
    setSelectedFrame,
    handlePause,
  ]);

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
      animationFrameRef.current = window.requestAnimationFrame(
        (t) => playAnimationRef.current?.(t),
      );
    }
  };

  const handlePlayGroup = (group: AnimationGroup) => {
    handlePause();
    setActiveGroup(group);
    if (group.frameIndices.length > 0) {
      setSelectedFrame(group.frameIndices[0]);
      isReverseRef.current = false;
      setIsPlaying(true);
      frameStartTimeRef.current = performance.now();
      animationFrameRef.current = window.requestAnimationFrame(
        (t) => playAnimationRef.current?.(t),
      );
    }
  };

  const handlePlayAll = () => {
    setActiveGroup(null);
    handlePlay();
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = window.requestAnimationFrame(
        (t) => playAnimationRef.current?.(t),
      );
    }
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <section
      className={`pointer-events-none self-center px-2 flex flex-col items-center gap-1 w-fit z-50`}
    >
      {/* Animation Group Panel */}
      <AnimationGroupPanel
        isOpen={showGroupPanel}
        onToggle={() => setShowGroupPanel(!showGroupPanel)}
        onPlayGroup={handlePlayGroup}
      />

      {/* Active Group Indicator */}
      {activeGroup && (
        <div className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 bg-primary-600/20 text-primary-600 rounded text-xs">
          <span className="capitalize">{activeGroup.name}</span>
          <button
            onClick={() => {
              setActiveGroup(null);
              handlePause();
            }}
            className="ml-1 hover:text-primary-800"
            title="Clear group filter"
          >
            ×
          </button>
        </div>
      )}

      {/* Frame indicator / playhead */}
      <div className="pointer-events-auto px-2 py-0.5 bg-neutral-800 text-neutral-200 rounded text-xs font-mono tabular-nums">
        {selectedFrame + 1}/{liveArtwork.frames.length}
      </div>

      <div
        className={`pointer-events-none flex flex-row justify-center items-center gap-2 w-fit h-10 px-2 rounded-2xl text-neutral-900 bg-neutral-100 shadow-2xl shadow-neutral-900`}
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
      </div>
    </section>
  );
};

export default AnimationControl;
