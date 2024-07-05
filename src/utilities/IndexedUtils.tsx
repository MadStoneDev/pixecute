import { db } from "@/utilities/db";
import { Artwork, ArtworkHistory, ArtworkObject } from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";
import { generateRandomString } from "@/utilities/GeneralUtils";

export const saveGeneral = async (key: string, value: any): Promise<void> => {
  await db.general.put({ key, value });
};

export const getGeneral = async (key: string): Promise<any> => {
  const item = await db.general.get(key);
  return item?.value ?? null;
};

export const saveHistory = async (
  artworkObject: ArtworkHistory,
): Promise<void> => {
  // const history = await db.history.toArray();
  // let historyPointer = (await db.general.get("historyPointer"))?.value || 0;
  // let newHistoryData: ArtworkObject[];
  //
  // if (history.length === 0) {
  //   newHistoryData = [artworkObject];
  //   historyPointer = 0;
  // } else {
  //   if (historyPointer < history.length - 1) {
  //     // On change, clear any history that is newer than the current
  //     newHistoryData = history.slice(0, historyPointer + 1);
  //   } else {
  //     newHistoryData = history;
  //   }
  //
  //   newHistoryData.push(artworkObject);
  //   if (newHistoryData.length > 20) {
  //     newHistoryData.shift();
  //   }
  // }
  //
  // await db.history.clear();
  // await db.history.bulkAdd(newHistoryData);
  //
  // // move pointer to end of history
  // historyPointer = newHistoryData.length - 1;
  // await db.general.put({ key: "historyPointer", value: historyPointer });
};

export const getHistory = async (): Promise<ArtworkObject[]> => {
  return db.history.toArray();
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

export const getArtwork = async (
  key: string,
): Promise<ArtworkObject | null> => {
  const artwork = await db.artworks.where("keyIdentifier").equals(key).first();
  return artwork || NewArtworkObject;
};

export const loadArtwork = async (
  keyIdentifier: string,
): Promise<ArtworkObject | null> => {
  const savedArtwork = await getArtwork(keyIdentifier);
  return savedArtwork ?? NewArtworkObject;
};

export const generateKeyIdentifier = async (
  length: number = 10,
): Promise<string> => {
  let key: string = "";
  let exists: ArtworkObject | undefined;

  do {
    key = generateRandomString(length);
    exists = await db.artworks.where("keyIdentifier").equals(key).first();
  } while (exists != undefined);

  return key;
};
