// utils/CloudSync.ts
import { createClient } from "@/utils/supabase/client";
import { Artwork } from "@/types/canvas";
import {
  uploadArtworkData,
  uploadThumbnail,
  saveArtworkMeta,
  downloadArtworkData,
  getCloudArtworks,
  CloudArtworkMeta,
} from "@/utils/CloudStorage";
import { saveArtwork as saveToIndexedDB } from "@/utils/IndexedDB";

/**
 * Get the current authenticated user, or null.
 */
export const getCurrentUser = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Check if Supabase is configured (env vars set).
 */
export const isCloudEnabled = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Save artwork to cloud. Always saves to IndexedDB first (offline-first).
 * Returns true if cloud save succeeded.
 */
export const saveToCloud = async (
  artwork: Artwork,
  thumbnailDataUrl?: string,
  name?: string,
): Promise<boolean> => {
  // Always save locally first
  await saveToIndexedDB(artwork);

  if (!isCloudEnabled()) return false;

  const user = await getCurrentUser();
  if (!user || !artwork.keyIdentifier) return false;

  try {
    // Upload artwork data to storage
    const uploadResult = await uploadArtworkData(
      user.id,
      artwork.keyIdentifier,
      artwork,
    );
    if (!uploadResult) return false;

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailDataUrl) {
      thumbnailUrl = await uploadThumbnail(
        user.id,
        artwork.keyIdentifier,
        thumbnailDataUrl,
      );
    }

    // Save metadata to database
    await saveArtworkMeta(
      user.id,
      artwork,
      uploadResult.path,
      uploadResult.size,
      thumbnailUrl,
      name,
    );

    return true;
  } catch (error) {
    console.error("Cloud save failed:", error);
    return false;
  }
};

/**
 * Load artwork from cloud by storage path.
 */
export const loadFromCloud = async (
  storagePath: string,
): Promise<Artwork | null> => {
  const artwork = await downloadArtworkData(storagePath);
  if (artwork) {
    // Also save to IndexedDB for offline access
    await saveToIndexedDB(artwork);
  }
  return artwork;
};

/**
 * Get list of all cloud artworks for the current user.
 */
export const listCloudArtworks = async (): Promise<CloudArtworkMeta[]> => {
  if (!isCloudEnabled()) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  return getCloudArtworks();
};

/**
 * Sign in with email and password.
 */
export const signIn = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user ?? null, error };
};

/**
 * Sign up with email and password.
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string,
) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  return { user: data?.user ?? null, error };
};

/**
 * Sign out.
 */
export const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

/**
 * Listen for auth state changes.
 */
export const onAuthStateChange = (
  callback: (user: any | null) => void,
) => {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return subscription;
};
