"use client";

import React, { useState, useEffect } from "react";
import { Artwork } from "@/types/canvas";
import useArtStore from "@/utils/Zustand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconSettings } from "@tabler/icons-react";

interface FrameSettingsModalProps {
  liveArtwork: Artwork;
  setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
  setHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FrameSettingsModal = ({
  liveArtwork,
  setLiveArtwork,
  setHasChanged,
}: FrameSettingsModalProps) => {
  const { selectedFrame } = useArtStore();
  const [isOpen, setIsOpen] = useState(false);
  const [frameDuration, setFrameDuration] = useState(100);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (selectedFrame < liveArtwork.frames.length) {
      setFrameDuration(liveArtwork.frames[selectedFrame]);
    }
  }, [selectedFrame, liveArtwork.frames]);

  const handleSave = () => {
    const updatedArtwork = { ...liveArtwork };

    if (applyToAll) {
      // Apply to all frames
      updatedArtwork.frames = updatedArtwork.frames.map(() => frameDuration);
    } else {
      // Apply to current frame only
      updatedArtwork.frames[selectedFrame] = frameDuration;
    }

    setLiveArtwork(updatedArtwork);
    setHasChanged(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset to current frame duration
    if (selectedFrame < liveArtwork.frames.length) {
      setFrameDuration(liveArtwork.frames[selectedFrame]);
    }
    setApplyToAll(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={`p-2 hover:bg-primary-600 hover:text-neutral-100 transition-all duration-300`}
        >
          <IconSettings size={24} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-neutral-100 text-neutral-900">
        <DialogHeader>
          <DialogTitle>Frame Settings</DialogTitle>
          <DialogDescription className="text-neutral-600">
            Configure timing for frame {selectedFrame + 1}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right font-medium">
              Duration
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                min="1"
                max="10000"
                value={frameDuration}
                onChange={(e) =>
                  setFrameDuration(parseInt(e.target.value) || 100)
                }
                className="flex-1"
              />
              <span className="text-sm text-neutral-600">ms</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox
                id="apply-all"
                checked={applyToAll}
                onCheckedChange={(checked: boolean) =>
                  setApplyToAll(checked as boolean)
                }
              />
              <Label
                htmlFor="apply-all"
                className="text-sm font-normal cursor-pointer"
              >
                Apply to all frames
              </Label>
            </div>
          </div>

          <div className="col-span-4 p-3 bg-neutral-200 rounded-md">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="text-xs text-neutral-600 space-y-1">
              <p>Current frame: {selectedFrame + 1}</p>
              <p>
                Duration: {frameDuration}ms ({(frameDuration / 1000).toFixed(2)}
                s)
              </p>
              <p>FPS equivalent: ~{Math.round(1000 / frameDuration)}</p>
              {applyToAll && (
                <p className="text-orange-600 font-medium">
                  Will apply to all {liveArtwork.frames.length} frames
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary-600 hover:bg-primary-700 text-neutral-100"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
