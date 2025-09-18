"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Route } from "next";
import useArtStore from "@/utils/Zustand";

import {
  getAllArtworks,
  deleteArtwork,
  exportArtworkAsJSON,
  exportArtworkAsPNG,
  ArtworkInfo,
} from "@/utils/ArtworkManager";
import {
  importFile,
  supportedFileTypes,
  ImportResult,
} from "@/utils/ImageImport";
import { getArtwork } from "@/utils/IndexedDB";

import {
  IconUpload,
  IconTrash,
  IconDownload,
  IconFolderOpen,
  IconPhoto,
  IconFileExport,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import Logo from "@/components/Logo";

export default function ArtworkBrowser() {
  const router = useRouter();
  const { setKeyIdentifier, reset, setCanvasSize } = useArtStore();

  const [artworks, setArtworks] = useState<ArtworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    setLoading(true);
    try {
      const artworkList = await getAllArtworks();
      setArtworks(artworkList);
    } catch (error) {
      console.error("Failed to load artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (files: FileList) => {
    if (!files.length) return;

    setImporting(true);
    setImportMessage("");

    const results: ImportResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!supportedFileTypes.includes(file.type)) {
        results.push({
          success: false,
          error: `Unsupported file type: ${file.name}`,
        });
        continue;
      }

      const result = await importFile(file);
      results.push(result);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (successful > 0) {
      setImportMessage(
        `Successfully imported ${successful} file${successful > 1 ? "s" : ""}`,
      );
      await loadArtworks(); // Refresh the list
    }

    if (failed > 0) {
      const errors = results
        .filter((r) => !r.success)
        .map((r) => r.error)
        .join(", ");
      setImportMessage((prev) =>
        prev
          ? `${prev}. Failed: ${failed} (${errors})`
          : `Failed to import ${failed} file${
              failed > 1 ? "s" : ""
            }: ${errors}`,
      );
    }

    setImporting(false);
    setTimeout(() => setImportMessage(""), 5000);
  };

  const handleOpenArtwork = async (keyIdentifier: string) => {
    try {
      const artwork = await getArtwork(keyIdentifier);
      if (artwork) {
        // Set canvas size based on artwork dimensions
        const firstLayer = artwork.layers[0];
        if (firstLayer?.frames[1]) {
          const imageData = firstLayer.frames[1];
          setCanvasSize({
            width: imageData.width,
            height: imageData.height,
          });
        }

        setKeyIdentifier(keyIdentifier);
        router.push(`/editor` as Route);
      }
    } catch (error) {
      console.error("Failed to open artwork:", error);
    }
  };

  const handleDeleteArtwork = async (keyIdentifier: string) => {
    if (window.confirm("Are you sure you want to delete this artwork?")) {
      const success = await deleteArtwork(keyIdentifier);
      if (success) {
        await loadArtworks();
      }
    }
  };

  const handleExportJSON = async (keyIdentifier: string) => {
    try {
      const artwork = await getArtwork(keyIdentifier);
      if (artwork) {
        exportArtworkAsJSON(artwork);
      }
    } catch (error) {
      console.error("Failed to export artwork:", error);
    }
  };

  const handleExportPNG = async (keyIdentifier: string) => {
    try {
      const artwork = await getArtwork(keyIdentifier);
      if (artwork) {
        // Export at 4x scale for better quality
        exportArtworkAsPNG(artwork, 0, 4);
      }
    } catch (error) {
      console.error("Failed to export PNG:", error);
    }
  };

  return (
    <section className="py-8 px-4 md:px-8 flex flex-col justify-center gap-6 lg:gap-10 h-full overflow-hidden">
      {/* Header */}
      <article>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm md:text-lg font-medium text-primary-600">
            Your Artworks ({artworks.length})
          </h3>
          <button
            onClick={loadArtworks}
            className="p-1 hover:bg-primary-700 rounded transition-colors"
            title="Refresh"
          >
            <IconRefresh size={20} />
          </button>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedFileTypes.join(",")}
            onChange={(e) => e.target.files && handleFileImport(e.target.files)}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full p-4 border-2 border-dashed border-neutral-300 hover:border-primary-600 rounded-lg transition-colors flex flex-col items-center gap-2 text-neutral-600 hover:text-primary-600"
          >
            <IconUpload size={24} />
            <span className="text-sm font-medium">
              {importing ? "Importing..." : "Import Images & Pixecute Files"}
            </span>
            <span className="text-xs">PNG, JPG, GIF, ICO, PIXECUTE</span>
          </button>

          {importMessage && (
            <p
              className={`mt-2 text-xs ${
                importMessage.includes("Failed")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {importMessage}
            </p>
          )}
        </div>
      </article>

      {/* Artworks Grid */}
      <article className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading artworks...</div>
          </div>
        ) : artworks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-500">
            <IconPhoto size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No artworks found</p>
            <p className="text-xs">Import some images or create new artwork</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.keyIdentifier}
                className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-neutral-100 flex items-center justify-center p-4">
                  {artwork.thumbnail ? (
                    <img
                      src={artwork.thumbnail}
                      alt={artwork.name}
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <IconPhoto size={32} className="text-neutral-400" />
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate mb-1">
                    {artwork.name}
                  </h4>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                    <div>
                      {artwork.dimensions.width}×{artwork.dimensions.height}
                    </div>
                    <div>
                      {artwork.frameCount} frame
                      {artwork.frameCount !== 1 ? "s" : ""}
                    </div>
                    <div>
                      {artwork.layerCount} layer
                      {artwork.layerCount !== 1 ? "s" : ""}
                    </div>
                    <div>{artwork.fileSize}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <button
                      onClick={() => handleOpenArtwork(artwork.keyIdentifier)}
                      className="flex-1 p-2 bg-primary-600 hover:bg-primary-700 min-w-20 text-white rounded text-xs font-medium transition-colors"
                      title="Open"
                    >
                      <IconFolderOpen size={14} className="mx-auto" />
                    </button>

                    <button
                      onClick={() => handleExportPNG(artwork.keyIdentifier)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-300 rounded text-neutral-900 transition-colors"
                      title="Export PNG"
                    >
                      <IconDownload size={14} />
                    </button>

                    <button
                      onClick={() => handleExportJSON(artwork.keyIdentifier)}
                      className="p-2 bg-neutral-100 hover:bg-neutral-300 rounded text-neutral-900 transition-colors"
                      title="Export Pixecute File"
                    >
                      <Logo className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteArtwork(artwork.keyIdentifier)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
