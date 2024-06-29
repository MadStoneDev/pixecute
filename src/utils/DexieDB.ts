import Dexie, { Table } from "dexie";
import { Artwork } from "@/types/canvas";

class PixecuteDB extends Dexie {
  artworks!: Table<Artwork, number>;
  history!: Table<Artwork, number>;
  general!: Table<{ key: string; value: any }, string>;
  constructor() {
    super("Pixecute");
    this.version(1).stores({
      artworks: "++id,&keyIdentifier",
      history: "++id",
      general: "key",
    });
  }
}

export const db: PixecuteDB = new PixecuteDB();
