"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useArtStore from "@/utils/Zustand";
import {
  listCloudArtworks,
  loadFromCloud,
  getCurrentUser,
  isCloudEnabled,
} from "@/utils/CloudSync";
import {
  deleteCloudArtwork,
  CloudArtworkMeta,
} from "@/utils/CloudStorage";
import {
  IconCloud,
  IconCloudOff,
  IconTrash,
  IconFolderOpen,
  IconRefresh,
  IconPhoto,
} from "@tabler/icons-react";

export const CloudGallery = () => {
  const router = useRouter();
  const setKeyIdentifier = useArtStore((s) => s.setKeyIdentifier);
  const setCanvasSize = useArtStore((s) => s.setCanvasSize);

  const [artworks, setArtworks] = useState<CloudArtworkMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isCloudEnabled()) {
      setLoading(false);
      return;
    }
    getCurrentUser().then((u) => {
      setUser(u);
      if (u) loadArtworks();
      else setLoading(false);
    });
  }, []);

  const loadArtworks = async () => {
    setLoading(true);
    const list = await listCloudArtworks();
    setArtworks(list);
    setLoading(false);
  };

  const handleOpen = async (art: CloudArtworkMeta) => {
    if (!art.storage_path) return;
    const artwork = await loadFromCloud(art.storage_path);
    if (artwork) {
      setCanvasSize({ width: art.width, height: art.height });
      setKeyIdentifier(art.key_identifier);
      router.push("/editor");
    }
  };

  const handleDelete = async (art: CloudArtworkMeta) => {
    if (!window.confirm(`Delete "${art.name}" from the cloud?`)) return;
    const ok = await deleteCloudArtwork(art.id, art.storage_path);
    if (ok) {
      setArtworks((prev) => prev.filter((a) => a.id !== art.id));
    }
  };

  if (!isCloudEnabled()) {
    return (
      <div className="py-8 px-4 flex flex-col items-center gap-2 text-neutral-500">
        <IconCloudOff size={32} className="opacity-50" />
        <p className="text-sm">Cloud features not configured</p>
        <p className="text-xs">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-8 px-4 flex flex-col items-center gap-2 text-neutral-500">
        <IconCloud size={32} className="opacity-50" />
        <p className="text-sm">Sign in to view cloud artworks</p>
      </div>
    );
  }

  return (
    <section className="py-4 px-4 md:px-8 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-lg font-medium text-primary-600 flex items-center gap-2">
          <IconCloud size={20} />
          Cloud Artworks ({artworks.length})
        </h3>
        <button
          onClick={loadArtworks}
          className="p-1 hover:bg-primary-700 rounded transition-colors"
          title="Refresh"
        >
          <IconRefresh size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="text-neutral-500 text-sm">Loading...</div>
        </div>
      ) : artworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-neutral-500">
          <IconPhoto size={28} className="mb-2 opacity-50" />
          <p className="text-sm">No cloud artworks</p>
          <p className="text-xs">
            Use the cloud save button in the editor to sync
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {artworks.map((art) => (
            <div
              key={art.id}
              className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-neutral-100 flex items-center justify-center p-3">
                {art.thumbnail_url ? (
                  <img
                    src={art.thumbnail_url}
                    alt={art.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <IconPhoto size={28} className="text-neutral-400" />
                )}
              </div>
              <div className="p-2">
                <h4 className="font-medium text-xs truncate">{art.name}</h4>
                <div className="text-[10px] text-neutral-500 space-y-0.5 mt-1">
                  <div>
                    {art.width}x{art.height}
                  </div>
                  <div>
                    {art.frame_count} frame{art.frame_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => handleOpen(art)}
                    className="flex-1 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs transition-colors"
                    title="Open"
                  >
                    <IconFolderOpen size={12} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(art)}
                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                    title="Delete from cloud"
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
