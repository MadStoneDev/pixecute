import { Artwork } from "@/types/canvas";
import { createEmptyFrame } from "@/utils/NewArtwork";

export const DummyArtwork: Artwork = {
  keyIdentifier: "F4S7J3h",
  layers: [
    {
      name: "Layer 1",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: new ImageData(1, 1),
        2: new ImageData(1, 1),
        3: new ImageData(1, 1),
        4: new ImageData(1, 1),
      },
    },
    {
      name: "This layer has long name",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: new ImageData(1, 1),
        2: new ImageData(1, 1),
        3: new ImageData(1, 1),
        4: new ImageData(1, 1),
      },
    },
    {
      name: "Layer 3",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 4",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 5",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
    {
      name: "Layer 6",
      opacity: 1,
      visible: true,
      locked: false,
      frames: {
        1: createEmptyFrame(),
        2: createEmptyFrame(),
        3: createEmptyFrame(),
        4: createEmptyFrame(),
      },
    },
  ],
  frames: [100, 100, 100, 100],
};
