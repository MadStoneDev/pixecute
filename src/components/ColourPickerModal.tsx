"use client";

import React, { useEffect, useRef, useState } from "react";
import useArtStore from "@/utils/Zustand";
import { hexToHsl, hexToRgb, hslToHex, rgbToHex } from "@/utils/Colour";

interface ColourPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialColor?: string;
  onColorSelect: (color: string) => void;
}

export const ColourPickerModal = ({
  isOpen,
  onClose,
  initialColor = "#000000",
  onColorSelect,
}: ColourPickerModalProps) => {
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [mode, setMode] = useState<"HSB" | "RGB" | "HEX">("HSB");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const alphaCanvasRef = useRef<HTMLCanvasElement>(null);
  const { addColourToPalette } = useArtStore();

  useEffect(() => {
    if (initialColor) {
      setCurrentColor(initialColor);
      setHexInput(initialColor.toUpperCase());
      updateFromHex(initialColor);
    }
  }, [initialColor]);

  const updateFromHex = (hex: string) => {
    try {
      const hslColor = hexToHsl(hex);
      const rgbColor = hexToRgb(hex);
      setHsl(hslColor);
      setRgb(rgbColor);
      drawColorPicker();
    } catch (error) {
      console.error("Invalid hex color:", hex);
    }
  };

  const updateFromHSL = (newHsl: { h: number; s: number; l: number }) => {
    const hex = hslToHex(newHsl);
    const rgbColor = hexToRgb(hex);

    setCurrentColor(hex);
    setHexInput(hex.toUpperCase());
    setHsl(newHsl);
    setRgb(rgbColor);
    drawColorPicker();
  };

  const updateFromRGB = (newRgb: { r: number; g: number; b: number }) => {
    const hex = rgbToHex(newRgb);
    const hslColor = hexToHsl(hex);

    setCurrentColor(hex);
    setHexInput(hex.toUpperCase());
    setRgb(newRgb);
    setHsl(hslColor);
    drawColorPicker();
  };

  const drawColorPicker = () => {
    const canvas = canvasRef.current;
    const hueCanvas = hueCanvasRef.current;
    const alphaCanvas = alphaCanvasRef.current;

    if (!canvas || !hueCanvas || !alphaCanvas) return;

    // Main saturation/brightness picker
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 200;
      canvas.height = 200;

      // Create saturation/brightness gradient
      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const s = (x / canvas.width) * 100;
          const l = 100 - (y / canvas.height) * 100;
          ctx.fillStyle = hslToHex({ h: hsl.h, s, l });
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Hue slider
    const hueCtx = hueCanvas.getContext("2d");
    if (hueCtx) {
      hueCanvas.width = 200;
      hueCanvas.height = 20;

      for (let x = 0; x < hueCanvas.width; x++) {
        const h = (x / hueCanvas.width) * 360;
        hueCtx.fillStyle = hslToHex({ h, s: 100, l: 50 });
        hueCtx.fillRect(x, 0, 1, hueCanvas.height);
      }
    }

    // Alpha slider (for future use)
    const alphaCtx = alphaCanvas.getContext("2d");
    if (alphaCtx) {
      alphaCanvas.width = 200;
      alphaCanvas.height = 20;

      // Checkered background
      for (let x = 0; x < alphaCanvas.width; x += 8) {
        for (let y = 0; y < alphaCanvas.height; y += 8) {
          alphaCtx.fillStyle =
            (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? "#fff" : "#ccc";
          alphaCtx.fillRect(x, y, 8, 8);
        }
      }

      // Alpha gradient
      const gradient = alphaCtx.createLinearGradient(
        0,
        0,
        alphaCanvas.width,
        0,
      );
      gradient.addColorStop(0, `${currentColor}00`);
      gradient.addColorStop(1, `${currentColor}ff`);
      alphaCtx.fillStyle = gradient;
      alphaCtx.fillRect(0, 0, alphaCanvas.width, alphaCanvas.height);
    }
  };

  useEffect(() => {
    drawColorPicker();
  }, [hsl.h, currentColor]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const s = (x / canvas.width) * 100;
    const l = 100 - (y / canvas.height) * 100;

    updateFromHSL({ ...hsl, s, l });
  };

  const handleHueClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const h = (x / canvas.width) * 360;

    updateFromHSL({ ...hsl, h });
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      setCurrentColor(value);
      updateFromHex(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded w-[320px] overflow-hidden border border-neutral-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-neutral-200 border-b border-neutral-300">
          <h3 className="text-sm font-medium text-neutral-900">Colors</h3>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-900 w-5 h-5 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Color Preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded border border-neutral-300 flex-shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <div className="flex-1 text-xs text-neutral-600">Current Color</div>
          </div>

          {/* Main Color Picker */}
          <div className="space-y-3">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="border border-neutral-300 cursor-crosshair w-full"
                style={{ height: "120px" }}
              />
              {/* Selection indicator */}
              <div
                className="absolute w-2 h-2 border border-white rounded-full pointer-events-none"
                style={{
                  left: `${(hsl.s / 100) * 200 - 4}px`,
                  top: `${(1 - hsl.l / 100) * 120 - 4}px`,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                }}
              />
            </div>

            {/* Hue Slider */}
            <div className="relative">
              <canvas
                ref={hueCanvasRef}
                onClick={handleHueClick}
                className="border border-neutral-300 cursor-crosshair w-full"
                style={{ height: "12px" }}
              />
              {/* Hue indicator */}
              <div
                className="absolute w-2 h-4 border border-white pointer-events-none"
                style={{
                  left: `${(hsl.h / 360) * 200 - 4}px`,
                  top: "-2px",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          </div>

          {/* Color Mode Tabs */}
          <div className="flex border border-neutral-300 rounded overflow-hidden">
            {(["HSB", "RGB", "HEX"] as const).map((modeOption) => (
              <button
                key={modeOption}
                onClick={() => setMode(modeOption)}
                className={`flex-1 px-3 py-1 text-xs font-medium transition-colors ${
                  mode === modeOption
                    ? "bg-neutral-900 text-neutral-100"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                }`}
              >
                {modeOption}
              </button>
            ))}
          </div>

          {/* Color Value Inputs */}
          <div className="space-y-2">
            {mode === "HSB" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">H</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={Math.round(hsl.h)}
                    onChange={(e) =>
                      updateFromHSL({
                        ...hsl,
                        h: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                  <span className="text-xs text-neutral-500">°</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">S</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(hsl.s)}
                    onChange={(e) =>
                      updateFromHSL({
                        ...hsl,
                        s: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                  <span className="text-xs text-neutral-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">B</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(hsl.l)}
                    onChange={(e) =>
                      updateFromHSL({
                        ...hsl,
                        l: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                  <span className="text-xs text-neutral-500">%</span>
                </div>
              </>
            )}

            {mode === "RGB" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">R</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) =>
                      updateFromRGB({
                        ...rgb,
                        r: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">G</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) =>
                      updateFromRGB({
                        ...rgb,
                        g: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-4 text-xs text-neutral-700">B</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) =>
                      updateFromRGB({
                        ...rgb,
                        b: parseInt(e.target.value) || 0,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600"
                  />
                </div>
              </>
            )}

            {mode === "HEX" && (
              <div className="flex items-center gap-2">
                <label className="w-4 text-xs text-neutral-700">#</label>
                <input
                  type="text"
                  value={hexInput.replace("#", "")}
                  onChange={(e) => handleHexChange("#" + e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:border-primary-600 font-mono uppercase"
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-300">
            <button
              onClick={() => addColourToPalette(currentColor)}
              className="px-3 py-1 text-xs bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded transition-colors"
            >
              Add to Palette
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onColorSelect(currentColor);
                onClose();
              }}
              className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
