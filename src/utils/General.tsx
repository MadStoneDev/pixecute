import { CanvasConfig } from "@/types/canvas";
import { generateKeyIdentifier, saveArtwork } from "@/utils/IndexedDB";
import { NewArtwork } from "@/utils/NewArtwork";

export const generateRandomString = (length: number = 10): string => {
  let result = "";

  // Letters and Numbers not including i, I, l, o, O, Q, 0 and 1
  const characters = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const createNewArtwork = async ({
  width = 16,
  height = 16,
  background = "transparent",
  keyIdentifier = "",
}: CanvasConfig) => {
  const uniqueKey =
    keyIdentifier === "" ? await generateKeyIdentifier(10) : keyIdentifier;

  const newArt = { ...NewArtwork };
  newArt.keyIdentifier = uniqueKey;

  await saveArtwork(newArt);

  return newArt;
};
