import { CanvasConfig } from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";

import {
  saveArtworkHistoryToSession,
  saveArtworkToSession,
} from "@/utilities/LayerUtils";

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

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const newArtwork = ({
  width = 16,
  height = 16,
  background = "transparent",
  randomKey = generateRandomString(10),
}: CanvasConfig) => {
  const config = {
    width,
    height,
    background,
    randomKey,
  };

  let configString = JSON.stringify(config);
  let configBase64 = btoa(`${configString}`);
  const configEncoded = configBase64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const freshArtwork = NewArtworkObject;
  saveArtworkToSession(freshArtwork, "artworkObject");
  saveArtworkHistoryToSession([freshArtwork], "history");
  sessionStorage.setItem("historyPointer", "0");

  return configBase64;
};

export { encodedUrl, decodedUrl, generateRandomString, newArtwork };
