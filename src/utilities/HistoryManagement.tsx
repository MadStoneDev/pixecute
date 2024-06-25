import { ArtworkObject } from "@/types/canvas";

import { db } from "@/utilities/db";

import {
  getGeneral,
  getHistory,
  saveGeneral,
  saveHistory,
} from "@/utilities/IndexedUtils";

const resetHistory = async (): Promise<void> => {
  await db.history.clear();
  await db.general.delete("historyPointer");
};

const updateHistory = async (artworkObject: ArtworkObject) => {
  await saveHistory(artworkObject);
  const historyPointer = await getHistoryPointer();
  await saveHistoryPointer(historyPointer + 1);
};

const saveHistoryPointer = async (pointer: number): Promise<void> => {
  await saveGeneral("historyPointer", pointer);
};

const getHistoryPointer = async (): Promise<number> => {
  const pointer = await getGeneral("historyPointer");
  return pointer ?? 0;
};

const undo = async (): Promise<ArtworkObject | null> => {
  const history = await getHistory();
  const historyPointer = await getHistoryPointer();

  if (historyPointer > 0) {
    const newPointer = historyPointer - 1;
    const artworkObject = history[newPointer] as ArtworkObject;
    await saveHistoryPointer(newPointer);
    return artworkObject;
  }

  return null;
};

const redo = async (): Promise<ArtworkObject | null> => {
  const history = await getHistory();
  const historyPointer = await getHistoryPointer();

  if (historyPointer < history.length - 1) {
    const newPointer = historyPointer + 1;
    const artworkObject = history[newPointer] as ArtworkObject;
    await saveHistoryPointer(newPointer);
    return artworkObject;
  }

  return null;
};

export { resetHistory, updateHistory, saveHistoryPointer, undo, redo };
