// utils/AnimationGroups.ts
import { Artwork, AnimationGroup } from "@/types/canvas";

const generateId = (): string =>
  Math.random().toString(36).substring(2, 10) +
  Date.now().toString(36);

export const PRESET_GROUP_NAMES = [
  "idle",
  "walk",
  "run",
  "jump",
  "attack",
  "hurt",
  "die",
  "fall",
  "climb",
  "swim",
  "cast",
  "block",
];

export const addAnimationGroup = (
  artwork: Artwork,
  name: string,
  frameIndices: number[] = [],
): Artwork => {
  const groups = artwork.groups ? [...artwork.groups] : [];
  groups.push({
    id: generateId(),
    name,
    frameIndices,
    loop: true,
    pingPong: false,
  });
  return { ...artwork, groups };
};

export const deleteAnimationGroup = (
  artwork: Artwork,
  groupId: string,
): Artwork => {
  const groups = (artwork.groups ?? []).filter((g) => g.id !== groupId);
  return { ...artwork, groups };
};

export const updateAnimationGroup = (
  artwork: Artwork,
  groupId: string,
  updates: Partial<Omit<AnimationGroup, "id">>,
): Artwork => {
  const groups = (artwork.groups ?? []).map((g) =>
    g.id === groupId ? { ...g, ...updates } : g,
  );
  return { ...artwork, groups };
};

export const addFrameToGroup = (
  artwork: Artwork,
  groupId: string,
  frameIndex: number,
): Artwork => {
  const groups = (artwork.groups ?? []).map((g) => {
    if (g.id === groupId && !g.frameIndices.includes(frameIndex)) {
      return { ...g, frameIndices: [...g.frameIndices, frameIndex] };
    }
    return g;
  });
  return { ...artwork, groups };
};

export const removeFrameFromGroup = (
  artwork: Artwork,
  groupId: string,
  frameIndex: number,
): Artwork => {
  const groups = (artwork.groups ?? []).map((g) => {
    if (g.id === groupId) {
      return {
        ...g,
        frameIndices: g.frameIndices.filter((fi) => fi !== frameIndex),
      };
    }
    return g;
  });
  return { ...artwork, groups };
};

/**
 * When frames are deleted, adjust group frame indices accordingly.
 */
export const adjustGroupsAfterFrameDelete = (
  artwork: Artwork,
  deletedIndex: number,
): Artwork => {
  const groups = (artwork.groups ?? []).map((g) => ({
    ...g,
    frameIndices: g.frameIndices
      .filter((fi) => fi !== deletedIndex)
      .map((fi) => (fi > deletedIndex ? fi - 1 : fi)),
  }));
  return { ...artwork, groups };
};

/**
 * When a frame is inserted, shift group indices at or after the insertion point.
 */
export const adjustGroupsAfterFrameInsert = (
  artwork: Artwork,
  insertedIndex: number,
): Artwork => {
  const groups = (artwork.groups ?? []).map((g) => ({
    ...g,
    frameIndices: g.frameIndices.map((fi) =>
      fi >= insertedIndex ? fi + 1 : fi,
    ),
  }));
  return { ...artwork, groups };
};

/**
 * Get the group a specific frame belongs to, if any.
 */
export const getGroupForFrame = (
  artwork: Artwork,
  frameIndex: number,
): AnimationGroup | undefined => {
  return (artwork.groups ?? []).find((g) =>
    g.frameIndices.includes(frameIndex),
  );
};
