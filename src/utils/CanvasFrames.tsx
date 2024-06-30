import { Artwork } from "@/types/canvas";

export const addNewFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  const framesCount = artwork.frames.length;

  artwork.frames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);

  for (const layer of artwork.layers) {
    for (let i = 0; i < framesCount; i++) {
      layer.frames[selectedFrame + 1] = new ImageData(1, 1);
    }
  }
};

export const deleteFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  artwork.frames.splice(selectedFrame, 1);

  for (const layer of artwork.layers) {
    for (let i = 0; i < artwork.frames.length; i++) {
      delete layer.frames[i + 1];
    }
  }
};

export const duplicateFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  const framesCount = artwork.frames.length;

  artwork.frames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);

  for (const layer of artwork.layers) {
    for (let i = 0; i < framesCount; i++) {
      layer.frames[selectedFrame + 1] = layer.frames[selectedFrame];
    }
  }
};

export const changeFrameTiming = ({
  artwork,
  selectedFrame,
  newFrameTiming,
}: {
  artwork: Artwork;
  selectedFrame: number;
  newFrameTiming: number;
}) => {
  artwork.frames[selectedFrame] = newFrameTiming;
};
