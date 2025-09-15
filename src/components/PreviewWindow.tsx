"use client";

import React, { useState, useEffect, useRef } from "react";
import { Artwork, Layer } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";
import { colourBackground } from "@/utils/CanvasLayers";
import {
  IconEye,
  IconEyeOff,
  IconExternalLink,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";

interface PreviewWindowProps {
  liveArtwork: Artwork;
  liveLayers: Layer[];
}

export const PreviewWindow = ({
  liveArtwork,
  liveLayers,
}: PreviewWindowProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const { selectedFrame, canvasSize, canvasBackground } = useArtStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameStartTimeRef = useRef<number>(0);

  // Update preview when selected frame changes
  useEffect(() => {
    if (!isPlaying) {
      setCurrentFrame(selectedFrame);
    }
  }, [selectedFrame, isPlaying]);

  // Render current frame
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, liveArtwork, liveLayers, canvasSize, canvasBackground]);

  const renderFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;

    if (!canvas || !backgroundCanvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const bgCtx = backgroundCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx || !bgCtx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    backgroundCanvas.width = canvasSize.width;
    backgroundCanvas.height = canvasSize.height;

    // Configure rendering
    ctx.imageSmoothingEnabled = false;
    bgCtx.imageSmoothingEnabled = false;

    // Clear and render background
    colourBackground(canvasBackground, backgroundCanvas);

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render visible layers for current frame
    liveLayers.forEach((layer) => {
      if (layer.visible && layer.frames[frameIndex + 1]) {
        const imageData = layer.frames[frameIndex + 1];
        if (imageData) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    });
  };

  const playAnimation = (time: number) => {
    if (!isPlaying) return;

    if (!frameStartTimeRef.current) {
      frameStartTimeRef.current = time;
    }

    const frameDuration = liveArtwork.frames[currentFrame] || 100;
    const elapsedTime = time - frameStartTimeRef.current;

    if (elapsedTime >= frameDuration) {
      frameStartTimeRef.current = time;
      setCurrentFrame((prevFrame) => {
        const nextFrame = (prevFrame + 1) % liveArtwork.frames.length;
        return nextFrame;
      });
    }

    animationFrameRef.current = window.requestAnimationFrame(playAnimation);
  };

  const toggleAnimation = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      setIsPlaying(true);
      frameStartTimeRef.current = performance.now();
      animationFrameRef.current = window.requestAnimationFrame(playAnimation);
    }
  };

  const openInNewTab = () => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;

    if (!canvas || !backgroundCanvas) return;

    // Create a larger canvas for better visibility
    const exportCanvas = document.createElement("canvas");
    const scale = Math.max(
      1,
      Math.floor(800 / Math.max(canvasSize.width, canvasSize.height)),
    );

    exportCanvas.width = canvasSize.width * scale;
    exportCanvas.height = canvasSize.height * scale;

    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    exportCtx.imageSmoothingEnabled = false;

    // Draw background
    exportCtx.drawImage(
      backgroundCanvas,
      0,
      0,
      backgroundCanvas.width,
      backgroundCanvas.height,
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );

    // Draw main content
    exportCtx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );

    // Open in new tab
    const dataURL = exportCanvas.toDataURL("image/png");
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Pixecute Preview</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #222; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                image-rendering: pixelated; 
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
              }
            </style>
          </head>
          <body>
            <img src="${dataURL}" alt="Pixecute Preview" />
          </body>
        </html>
      `);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="pointer-events-auto fixed top-4 right-4 p-2 bg-neutral-100 hover:bg-primary-600 hover:text-neutral-100 text-neutral-900 rounded transition-all duration-300 z-40"
        title="Show Preview"
      >
        <IconEye size={20} />
      </button>
    );
  }

  return (
    <div className="pointer-events-auto fixed top-4 right-4 bg-neutral-100 rounded overflow-hidden z-40 border border-neutral-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-neutral-900 text-neutral-100">
        <span className="text-xs font-medium">
          Frame {currentFrame + 1}/{liveArtwork.frames.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleAnimation}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <IconPlayerPause size={14} />
            ) : (
              <IconPlayerPlay size={14} />
            )}
          </button>
          <button
            onClick={openInNewTab}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
            title="Open in New Tab"
          >
            <IconExternalLink size={14} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
            title="Hide Preview"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="p-3" style={{ minWidth: "120px", minHeight: "120px" }}>
        <div
          className="relative mx-auto border border-neutral-300"
          style={{
            width: Math.max(100, Math.min(200, canvasSize.width * 8)),
            height: Math.max(100, Math.min(200, canvasSize.height * 8)),
            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          }}
        >
          {/* Background Canvas */}
          <canvas
            ref={backgroundCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Main Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Frame Info */}
        <div className="mt-2 text-xs text-center text-neutral-600">
          {/*{liveArtwork.frames[displayFrame]}ms*/}
          {isPlaying && <span className="ml-2 text-primary-600">Playing</span>}
        </div>
      </div>
    </div>
  );
};
