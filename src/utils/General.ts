import { NewArtwork } from "@/utils/NewArtwork";
import { generateKeyIdentifier, saveArtwork } from "@/utils/IndexedDB";

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

interface NewArtworkConfig {
  keyIdentifier?: string;
  name?: string;
  setKeyIdentifier: (key: string) => void;
  reset: () => void;
}

export const createNewArtwork = async ({
  keyIdentifier = "",
  name,
  setKeyIdentifier,
  reset,
}: NewArtworkConfig) => {
  reset();

  const uniqueKey =
    keyIdentifier === "" ? await generateKeyIdentifier(10) : keyIdentifier;

  const newArt = { ...NewArtwork };
  newArt.keyIdentifier = uniqueKey;
  if (name) newArt.name = name;

  setKeyIdentifier(uniqueKey);

  await saveArtwork(newArt);
  return newArt;
};
