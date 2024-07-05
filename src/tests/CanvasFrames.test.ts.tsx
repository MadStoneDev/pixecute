import "@testing-library/jest-dom";
import { DummyArtwork } from "@/data/DummyArtwork";
import { addNewFrame } from "@/utils/CanvasFrames";

it("should add a new frame", () => {
  const artwork = DummyArtwork;
  const currentFrameCount = artwork.frames.length;

  addNewFrame({ artwork });
  expect(artwork.frames.length).toBe(currentFrameCount + 1);
});

it("should remove an existing frame", () => {
  const artwork = DummyArtwork;
  const currentFrameCount = artwork.frames.length;

  addNewFrame({ artwork });
  expect(artwork.frames.length).toBe(currentFrameCount + 1);
});
