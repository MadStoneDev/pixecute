// utils/CloudStorage.ts
import { createClient } from "@/utils/supabase/client";
import { Artwork } from "@/types/canvas";
import { serializeArtwork, deserializeArtwork } from "@/utils/Serialization";

export interface CloudArtworkMeta {
  id: string;
  key_identifier: string;
  name: string;
  width: number;
  height: number;
  frame_count: number;
  layer_count: number;
  thumbnail_url: string | null;
  storage_path: string | null;
  file_size: number;
  created_at: string;
  updated_at: string;
}

/**
 * Upload serialized artwork data to Supabase Storage.
 */
export const uploadArtworkData = async (
  userId: string,
  keyIdentifier: string,
  artwork: Artwork,
): Promise<{ path: string; size: number } | null> => {
  const supabase = createClient();

  const serialized = serializeArtwork(artwork);
  const jsonString = JSON.stringify(serialized);
  const blob = new Blob([jsonString], { type: "application/json" });
  const path = `${userId}/${keyIdentifier}.pixecute`;

  const { error } = await supabase.storage
    .from("artworks")
    .upload(path, blob, { upsert: true });

  if (error) {
    console.error("Failed to upload artwork data:", error);
    return null;
  }

  return { path, size: blob.size };
};

/**
 * Download and deserialize artwork data from Supabase Storage.
 */
export const downloadArtworkData = async (
  storagePath: string,
): Promise<Artwork | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("artworks")
    .download(storagePath);

  if (error || !data) {
    console.error("Failed to download artwork data:", error);
    return null;
  }

  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return deserializeArtwork(parsed);
  } catch (err) {
    console.error("Failed to parse artwork data:", err);
    return null;
  }
};

/**
 * Upload thumbnail to Supabase Storage.
 */
export const uploadThumbnail = async (
  userId: string,
  keyIdentifier: string,
  thumbnailDataUrl: string,
): Promise<string | null> => {
  const supabase = createClient();

  // Convert data URL to blob
  const response = await fetch(thumbnailDataUrl);
  const blob = await response.blob();
  const path = `${userId}/${keyIdentifier}.png`;

  const { error } = await supabase.storage
    .from("thumbnails")
    .upload(path, blob, { upsert: true, contentType: "image/png" });

  if (error) {
    console.error("Failed to upload thumbnail:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("thumbnails")
    .getPublicUrl(path);

  return urlData.publicUrl;
};

/**
 * Save artwork metadata to the database.
 */
export const saveArtworkMeta = async (
  userId: string,
  artwork: Artwork,
  storagePath: string,
  fileSize: number,
  thumbnailUrl: string | null,
  name?: string,
): Promise<CloudArtworkMeta | null> => {
  const supabase = createClient();

  const firstFrame = artwork.layers[0]?.frames[0];
  const width = firstFrame?.width ?? 16;
  const height = firstFrame?.height ?? 16;

  const { data, error } = await supabase
    .from("artworks")
    .upsert(
      {
        user_id: userId,
        key_identifier: artwork.keyIdentifier,
        name: name || `Artwork_${artwork.keyIdentifier?.slice(0, 8)}`,
        width,
        height,
        frame_count: artwork.frames.length,
        layer_count: artwork.layers.length,
        thumbnail_url: thumbnailUrl,
        storage_path: storagePath,
        file_size: fileSize,
      },
      { onConflict: "user_id,key_identifier" },
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save artwork metadata:", error);
    return null;
  }

  return data;
};

/**
 * Get all artworks metadata for the current user.
 */
export const getCloudArtworks = async (): Promise<CloudArtworkMeta[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch cloud artworks:", error);
    return [];
  }

  return data ?? [];
};

/**
 * Delete artwork from cloud (storage + metadata).
 */
export const deleteCloudArtwork = async (
  artworkId: string,
  storagePath: string | null,
): Promise<boolean> => {
  const supabase = createClient();

  if (storagePath) {
    await supabase.storage.from("artworks").remove([storagePath]);
  }

  const { error } = await supabase
    .from("artworks")
    .delete()
    .eq("id", artworkId);

  if (error) {
    console.error("Failed to delete cloud artwork:", error);
    return false;
  }

  return true;
};
