import { Artwork } from "@/types/canvas";
import { createEmptyFrame, generateLayerId } from "@/utils/NewArtwork";

export const DummyArtwork: Artwork = {
  keyIdentifier: "F4S7J3h",
  layers: [
    {
      id: generateLayerId(),
      name: "Layer 1",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        new ImageData(1, 1),
        new ImageData(1, 1),
        new ImageData(1, 1),
        new ImageData(1, 1),
      ],
    },
    {
      id: generateLayerId(),
      name: "This layer has long name",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        new ImageData(1, 1),
        new ImageData(1, 1),
        new ImageData(1, 1),
        new ImageData(1, 1),
      ],
    },
    {
      id: generateLayerId(),
      name: "Layer 3",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
      ],
    },
    {
      id: generateLayerId(),
      name: "Layer 4",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
      ],
    },
    {
      id: generateLayerId(),
      name: "Layer 5",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
      ],
    },
    {
      id: generateLayerId(),
      name: "Layer 6",
      opacity: 1,
      visible: true,
      locked: false,
      frames: [
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
        createEmptyFrame(),
      ],
    },
  ],
  frames: [100, 100, 100, 100],
};
