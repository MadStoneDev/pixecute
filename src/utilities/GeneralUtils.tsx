import { CanvasConfig } from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";

import {
  generateKeyIdentifier,
  saveArtwork,
  saveHistory,
} from "@/utilities/IndexedUtils";
import { saveHistoryPointer } from "@/utilities/HistoryManagement";

const encodedUrl = (value: string) => {
  let valueString = JSON.stringify(value);
  let valueBase64 = btoa(`new=${valueString}`);
  return encodeURIComponent(valueBase64);
};

const decodedUrl = (value: string) => {
  let valueBase64 = decodeURIComponent(value);
  let valueString = atob(valueBase64);
  return JSON.parse(valueString);
};

const generateRandomString = (length: number) => {
  let result = "";

  // Remove i, I, o, O, Q, l, 0 and 1 from the character set
  const characters = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const newArtwork = async ({
  width = 16,
  height = 16,
  background = "transparent",
  keyIdentifier = "",
}: CanvasConfig) => {
  const config = {
    width,
    height,
    background,
    keyIdentifier: await generateKeyIdentifier(),
  };

  let configString = JSON.stringify(config);
  let configBase64 = btoa(`${configString}`);

  const freshArtwork = NewArtworkObject;
  await saveArtwork(freshArtwork);
  await saveHistory(freshArtwork);
  await saveHistoryPointer(0);

  return configBase64;
};

export { encodedUrl, decodedUrl, generateRandomString, newArtwork };
