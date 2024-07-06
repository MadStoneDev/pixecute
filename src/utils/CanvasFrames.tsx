import { Artwork } from "@/types/canvas";

export const addNewFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  artwork.frames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);
  const actualSelectedFrame = selectedFrame + 1;

  for (const layer of artwork.layers) {
    for (let i = artwork.frames.length; i > actualSelectedFrame + 1; i--) {
      layer.frames[i] = layer.frames[i - 1];
    }

    layer.frames[actualSelectedFrame + 1] = new ImageData(1, 1);
  }
};

export const deleteFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  // Edge Cases:
  // => Only 1 frame []
  // => Selected frame is out of bounds []
  // Typical Cases:
  // => Remove first frame []
  // => Remove middle frame []
  // => Remove last frame []

  if (
    artwork.frames.length === 1 ||
    selectedFrame >= artwork.frames.length ||
    selectedFrame < 0
  )
    return;

  artwork.frames.splice(selectedFrame, 1);
  const actualSelectedFrame = selectedFrame + 1;

  for (const layer of artwork.layers) {
    // Shift all the frames after the selected frame
    for (let i = actualSelectedFrame; i <= artwork.frames.length; i++) {
      layer.frames[i] = layer.frames[i + 1];
    }

    // Remove last frame
    delete layer.frames[artwork.frames.length + 1];
  }
};

export const duplicateFrame = ({
  artwork,
  selectedFrame,
}: {
  artwork: Artwork;
  selectedFrame: number;
}) => {
  artwork.frames.splice(selectedFrame + 1, 0, artwork.frames[selectedFrame]);

  for (const layer of artwork.layers) {
    const newFrames = { ...layer.frames };

    for (let i = Object.keys(newFrames).length; i > selectedFrame; i--) {
      newFrames[i + 1] = newFrames[i];
    }

    layer.frames = newFrames;
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
  // Edge Cases:
  // => Selected frame is out of bounds []
  if (selectedFrame >= artwork.frames.length) return;
  artwork.frames[selectedFrame] = newFrameTiming;
};

export const isFrameEmpty = (frame: ImageData | null) => {
  if (!frame) return true;

  for (let i = 0; i < frame.data.length; i++) {
    if (frame.data[i] !== 0) return false;
  }
  return true;
};
