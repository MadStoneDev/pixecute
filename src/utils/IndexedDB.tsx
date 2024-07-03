import { db } from "@/utils/DexieDB";
import { Artwork } from "@/types/canvas";
import { createNewArtwork, generateRandomString } from "@/utils/General";

export const saveGeneral = async (key: string, value: any): Promise<void> => {
  await db.general.put({ key, value });
};

export const getGeneral = async (key: string): Promise<any> => {
  const item = await db.general.get(key);
  return item?.value ?? null;
};

export const saveArtwork = async (artworkObject: Artwork): Promise<void> => {
  if (!artworkObject.keyIdentifier) {
    throw new Error("Artwork must have a keyIdentifier");
  }

  const existingArtwork = await db.artworks
    .where("keyIdentifier")
    .equals(artworkObject.keyIdentifier)
    .first();

  if (existingArtwork) {
    await db.artworks.update(existingArtwork.id as number, {
      ...artworkObject,
    });
  } else {
    await db.artworks.put(artworkObject);
  }

  const count = await db.artworks.count();
  if (count > 5) {
    const artworks = await db.artworks.orderBy("id").toArray();
    const artworkToDelete = artworks.slice(0, count - 5);

    for (const artwork of artworkToDelete) {
      await db.artworks.delete(artwork.id as number);
    }
  }
};

export const getArtwork = async (key: string): Promise<Artwork | undefined> => {
  return db.artworks.where("keyIdentifier").equals(key).first();
};

export const saveHistory = async (artworkObject: Artwork): Promise<void> => {
  const history = await db.history.toArray();
  let historyPointer = (await db.general.get("historyPointer"))?.value || 0;
  let newHistoryData: Artwork[];

  if (history.length === 0) {
    historyPointer = 0;
    newHistoryData = [artworkObject];
  } else {
    if (historyPointer < history.length - 1) {
      // On change, clear any history that is newer than the current
      newHistoryData = history.slice(0, historyPointer + 1);
    } else {
      newHistoryData = history;
    }

    newHistoryData.push(artworkObject);
    if (newHistoryData.length > 20) {
      newHistoryData.shift();
    }
  }

  await db.history.clear();
  await db.history.bulkAdd(newHistoryData);
  historyPointer = newHistoryData.length - 1;
  await db.general.put({ key: "historyPointer", value: historyPointer });
};

export const getHistory = async (): Promise<Artwork[]> => {
  return db.history.toArray();
};

export const clearHistory = async (): Promise<void> => {
  await db.history.clear();
};

export const saveHistoryPointer = async (pointer: number): Promise<void> => {
  await db.general.put({ key: "historyPointer", value: pointer });
};

export const getHistoryPointer = async (): Promise<number> => {
  const item = await db.general.get("historyPointer");
  return item?.value ?? 0;
};

export const generateKeyIdentifier = async (
  length: number = 10,
): Promise<string> => {
  let key: string = "";
  let exists: Artwork | undefined;

  do {
    key = generateRandomString(length);
    exists = await db.artworks.where("keyIdentifier").equals(key).first();
  } while (exists != undefined);

  return key;
};

export const checkForArtwork = async (
  keyIdentifier: string,
): Promise<Artwork | undefined> => {
  return await getArtwork(keyIdentifier);
};
