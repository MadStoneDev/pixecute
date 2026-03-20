// components/LayerSettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Layer, BlendMode } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import useArtStore from "@/utils/Zustand";
import {
  flipHorizontal,
  flipVertical,
  rotateCW,
  rotateCCW,
} from "@/utils/TransformTools";
import {
  IconFlipHorizontal,
  IconFlipVertical,
  IconRotateClockwise,
  IconRotate,
} from "@tabler/icons-react";

interface LayerSettingsModalProps {
  layer: Layer;
  layerIndex: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

export const LayerSettingsModal = ({
  layer,
  layerIndex,
  isOpen = false,
  setIsOpen,
}: LayerSettingsModalProps) => {
  const updateLayer = useArtStore((s) => s.updateLayer);
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const selectedFrame = useArtStore((s) => s.selectedFrame);
  const pushToHistory = useArtStore((s) => s.pushToHistory);
  const setHasChanged = useArtStore((s) => s.setHasChanged);

  // Display opacity as 0-100, store as 0-1
  const [opacityDisplay, setOpacityDisplay] = useState(
    Math.round((layer.opacity || 1) * 100),
  );
  const [blendMode, setBlendMode] = useState<BlendMode>(
    layer.blendMode || "source-over",
  );

  useEffect(() => {
    setOpacityDisplay(Math.round((layer.opacity || 1) * 100));
    setBlendMode(layer.blendMode || "source-over");
  }, [layer, isOpen]);

  const handleSave = () => {
    updateLayer(layerIndex, {
      opacity: opacityDisplay / 100, // Store as 0-1
      blendMode: blendMode,
    });

    setIsOpen(false);
  };

  const handleCancel = () => {
    setOpacityDisplay(Math.round((layer.opacity || 1) * 100));
    setBlendMode(layer.blendMode || "source-over");
    setIsOpen(false);
  };

  const handleBlendModeChange = (value: string) => {
    setBlendMode(value as BlendMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-100 text-neutral-900">
        <DialogHeader>
          <DialogTitle>Layer Settings</DialogTitle>
          <DialogDescription className="text-neutral-600">
            {layer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Opacity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="opacity-slider" className="text-sm font-medium">
                Opacity
              </Label>
              <span className="text-sm text-neutral-600 font-mono">
                {opacityDisplay}%
              </span>
            </div>
            <Slider
              id="opacity-slider"
              value={[opacityDisplay]}
              onValueChange={([value]) => setOpacityDisplay(value)}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>

          {/* Blend Mode Selector */}
          <div className="space-y-3">
            <Label htmlFor="blend-mode" className="text-sm font-medium">
              Blend Mode
            </Label>
            <Select value={blendMode} onValueChange={handleBlendModeChange}>
              <SelectTrigger className="bg-neutral-100 w-full">
                <SelectValue placeholder="Select blend mode" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-100 border-neutral-300">
                {BLEND_MODES.map((mode) => (
                  <SelectItem
                    key={mode.value}
                    value={mode.value}
                    className="hover:bg-neutral-200 focus:bg-neutral-200 text-neutral-900 hover:text-neutral-900 focus:text-neutral-900"
                  >
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="p-3 bg-neutral-200 rounded-md">
              <h4 className="text-sm font-medium mb-1">Blend Mode Info</h4>
              <p className="text-xs text-neutral-600">
                {getBlendModeDescription(blendMode)}
              </p>
            </div>
          </div>
        </div>

        {/* Transform Tools */}
        <div className="space-y-3 border-t border-neutral-300 pt-4">
          <Label className="text-sm font-medium">Transform (Current Frame)</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 border-neutral-300 text-neutral-700 bg-neutral-200 hover:bg-neutral-300"
              onClick={() => {
                pushToHistory("Flip horizontal");
                const updated = flipHorizontal(liveArtwork, layerIndex, selectedFrame);
                setLiveArtwork(updated);
                setHasChanged(true);
              }}
              title="Flip Horizontal"
            >
              <IconFlipHorizontal size={16} />
              <span className="text-xs">Flip H</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 border-neutral-300 text-neutral-700 bg-neutral-200 hover:bg-neutral-300"
              onClick={() => {
                pushToHistory("Flip vertical");
                const updated = flipVertical(liveArtwork, layerIndex, selectedFrame);
                setLiveArtwork(updated);
                setHasChanged(true);
              }}
              title="Flip Vertical"
            >
              <IconFlipVertical size={16} />
              <span className="text-xs">Flip V</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 border-neutral-300 text-neutral-700 bg-neutral-200 hover:bg-neutral-300"
              onClick={() => {
                pushToHistory("Rotate CW");
                const updated = rotateCW(liveArtwork, layerIndex, selectedFrame);
                setLiveArtwork(updated);
                setHasChanged(true);
              }}
              title="Rotate 90° Clockwise"
            >
              <IconRotateClockwise size={16} />
              <span className="text-xs">CW</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 border-neutral-300 text-neutral-700 bg-neutral-200 hover:bg-neutral-300"
              onClick={() => {
                pushToHistory("Rotate CCW");
                const updated = rotateCCW(liveArtwork, layerIndex, selectedFrame);
                setLiveArtwork(updated);
                setHasChanged(true);
              }}
              title="Rotate 90° Counter-Clockwise"
            >
              <IconRotate size={16} />
              <span className="text-xs">CCW</span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-neutral-300 text-neutral-700 hover:text-neutral-700 bg-neutral-300 hover:bg-neutral-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary-600 hover:bg-primary-700 text-neutral-100"
          >
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function getBlendModeDescription(mode: string): string {
  const descriptions: { [key: string]: string } = {
    "source-over":
      "Default blending mode. New shapes are drawn on top of existing content.",
    multiply:
      "Multiplies the colors, resulting in a darker image. White becomes transparent.",
    screen:
      "Inverts colors, multiplies them, and inverts again. Result is brighter than multiply.",
    overlay:
      "Combination of multiply and screen. Dark areas become darker, light areas become lighter.",
    darken: "Keeps the darker of the two colors at each pixel.",
    lighten: "Keeps the lighter of the two colors at each pixel.",
    "color-dodge": "Brightens the backdrop color to reflect the source color.",
    "color-burn": "Darkens the backdrop color to reflect the source color.",
    "hard-light":
      "Similar to overlay but uses the source color to determine which blend to apply.",
    "soft-light": "Similar to hard-light but produces a softer effect.",
    difference: "Subtracts the darker color from the lighter color.",
    exclusion: "Similar to difference but with lower contrast.",
    hue: "Preserves the luma and chroma of the backdrop while adopting the hue of the source.",
    saturation:
      "Preserves the luma and hue of the backdrop while adopting the chroma of the source.",
    color:
      "Preserves the luma of the backdrop while adopting the hue and chroma of the source.",
    luminosity:
      "Preserves the hue and chroma of the backdrop while adopting the luma of the source.",
  };

  return descriptions[mode] || "Custom blending mode.";
}
