import { Artwork } from "@/types/canvas";

export const addNewFrame = ({ artwork }: { artwork: Artwork }) => {
  const framesCount = artwork.frames.length;

  artwork.frames.splice(
    artwork.frames.length,
    0,
    artwork.frames[artwork.frames.length - 1],
  );

  for (const layer of artwork.layers) {
    for (let i = 0; i < framesCount; i++) {
      layer.frames[artwork.frames.length] = new ImageData(1, 1);
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
  // Edge Cases:
  // => Only 1 frame []
  // => Selected frame is out of bounds []
  // Typical Cases:
  // => Remove first frame []
  // => Remove middle frame []
  // => Remove last frame []

  if (artwork.frames.length === 1 || selectedFrame >= artwork.frames.length)
    return;
  artwork.frames.splice(selectedFrame, 1);

  const actualSelectedFrame = selectedFrame + 1;
  for (const layer of artwork.layers) {
    // Delete the frame from the layer
    delete layer.frames[actualSelectedFrame];

    // Shift all the frames after the selected frame
    for (let i = actualSelectedFrame; i < artwork.frames.length; i++) {
      layer.frames[i] = layer.frames[i + 1];
    }

    // Remove last frame
    delete layer.frames[artwork.frames.length];
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
    for (let i = artwork.frames.length - 1; i >= selectedFrame; i--) {
      layer.frames[i + 1] = layer.frames[i];
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
  // Edge Cases:
  // => Selected frame is out of bounds []
  if (selectedFrame >= artwork.frames.length) return;
  artwork.frames[selectedFrame] = newFrameTiming;
};
