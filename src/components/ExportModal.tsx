"use client";

import React, { useState, useCallback } from "react";
import useArtStore from "@/utils/Zustand";
import {
  exportArtworkAsPNG,
  exportArtworkAsJPG,
  exportArtworkAsJSON,
} from "@/utils/ArtworkManager";
import { downloadGif } from "@/utils/GifExporter";
import {
  downloadSpriteSheet,
  downloadCombinedGroupsSpriteSheet,
} from "@/utils/SpriteSheetExporter";
import {
  IconX,
  IconDownload,
  IconPhoto,
  IconGif,
  IconLayoutGrid,
  IconFileExport,
} from "@tabler/icons-react";

type ExportFormat = "png" | "jpg" | "gif" | "spritesheet" | "pixecute";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const keyIdentifier = useArtStore((s) => s.keyIdentifier);

  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [exportAllFrames, setExportAllFrames] = useState(false);
  const [jpgQuality, setJpgQuality] = useState(0.92);
  const [jpgBackground, setJpgBackground] = useState("#ffffff");
  const [spriteColumns, setSpriteColumns] = useState(0); // 0 = auto
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const groups = liveArtwork?.groups ?? [];
  const totalFrames = liveArtwork?.frames?.length ?? 1;
  const artworkName = liveArtwork?.name
    ? liveArtwork.name.replace(/[^a-zA-Z0-9_\- ]/g, "_")
    : keyIdentifier
      ? `Artwork_${keyIdentifier.slice(0, 8)}`
      : "Artwork";

  // Get frame indices based on group selection
  const getFrameIndices = (): number[] => {
    if (selectedGroupId === "all") {
      return Array.from({ length: totalFrames }, (_, i) => i);
    }
    const group = groups.find((g) => g.id === selectedGroupId);
    return group?.frameIndices ?? [];
  };

  const getExportName = (): string => {
    if (selectedGroupId === "all") return artworkName;
    const group = groups.find((g) => g.id === selectedGroupId);
    return group ? `${artworkName}_${group.name}` : artworkName;
  };

  const handleExport = useCallback(async () => {
    if (!liveArtwork) return;

    setIsExporting(true);
    setProgress(0);

    const frameIndices = getFrameIndices();
    const exportName = getExportName();

    try {
      switch (format) {
        case "png":
          if (exportAllFrames) {
            for (const fi of frameIndices) {
              exportArtworkAsPNG(
                liveArtwork,
                fi,
                scale,
                `${exportName}_frame${fi + 1}`,
              );
            }
          } else {
            exportArtworkAsPNG(liveArtwork, frameIndex, scale, exportName);
          }
          break;

        case "jpg":
          if (exportAllFrames) {
            for (const fi of frameIndices) {
              exportArtworkAsJPG(
                liveArtwork,
                fi,
                scale,
                jpgQuality,
                jpgBackground,
                `${exportName}_frame${fi + 1}`,
              );
            }
          } else {
            exportArtworkAsJPG(
              liveArtwork,
              frameIndex,
              scale,
              jpgQuality,
              jpgBackground,
              exportName,
            );
          }
          break;

        case "gif":
          await downloadGif(liveArtwork, exportName, {
            scale,
            frameIndices,
            onProgress: setProgress,
          });
          break;

        case "spritesheet":
          if (selectedGroupId === "all-combined") {
            downloadCombinedGroupsSpriteSheet(liveArtwork, exportName, {
              scale,
              includeMetadata,
            });
          } else {
            downloadSpriteSheet(liveArtwork, exportName, {
              scale,
              frameIndices,
              columns: spriteColumns > 0 ? spriteColumns : undefined,
              format: "png",
              includeMetadata,
            });
          }
          break;

        case "pixecute":
          exportArtworkAsJSON(liveArtwork, exportName);
          break;
      }

      // Batch export: all groups as separate files
      if (
        selectedGroupId === "all-separate" &&
        (format === "gif" || format === "spritesheet")
      ) {
        for (const group of groups) {
          const groupName = `${artworkName}_${group.name}`;
          if (format === "gif") {
            await downloadGif(liveArtwork, groupName, {
              scale,
              frameIndices: group.frameIndices,
              onProgress: setProgress,
            });
          } else if (format === "spritesheet") {
            downloadSpriteSheet(liveArtwork, groupName, {
              scale,
              frameIndices: group.frameIndices,
              columns: spriteColumns > 0 ? spriteColumns : undefined,
              format: "png",
              includeMetadata,
            });
          }
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [
    liveArtwork,
    format,
    scale,
    frameIndex,
    exportAllFrames,
    jpgQuality,
    jpgBackground,
    spriteColumns,
    includeMetadata,
    selectedGroupId,
    groups,
    totalFrames,
    artworkName,
  ]);

  if (!isOpen) return null;

  const formatOptions: {
    id: ExportFormat;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: "png",
      label: "PNG",
      icon: <IconPhoto size={18} />,
      description: "Lossless with transparency",
    },
    {
      id: "jpg",
      label: "JPG",
      icon: <IconPhoto size={18} />,
      description: "Compressed, no transparency",
    },
    {
      id: "gif",
      label: "GIF",
      icon: <IconGif size={18} />,
      description: "Animated, all frames",
    },
    {
      id: "spritesheet",
      label: "Sprite Sheet",
      icon: <IconLayoutGrid size={18} />,
      description: "All frames in a grid",
    },
    {
      id: "pixecute",
      label: "Pixecute",
      icon: <IconFileExport size={18} />,
      description: "Full project file",
    },
  ];

  const scalePresets = [1, 2, 4, 8];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded-2xl w-[400px] max-h-[90vh] overflow-hidden border border-neutral-300 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <IconDownload size={20} />
            <h3 className="font-medium">Export Artwork</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-grow">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formatOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`p-2 text-left rounded-lg border transition-colors ${
                    format === opt.id
                      ? "bg-primary-600 text-neutral-100 border-primary-600"
                      : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-sm">
                    {opt.icon}
                    {opt.label}
                  </div>
                  <div className="text-xs opacity-75 mt-0.5">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation Group Selection */}
          {groups.length > 0 &&
            (format === "gif" || format === "spritesheet") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Animation Group
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedGroupId("all")}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedGroupId === "all"
                        ? "bg-primary-600 text-neutral-100 border-primary-600"
                        : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                    }`}
                  >
                    All Frames
                  </button>
                  <button
                    onClick={() => setSelectedGroupId("all-separate")}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedGroupId === "all-separate"
                        ? "bg-primary-600 text-neutral-100 border-primary-600"
                        : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                    }`}
                  >
                    Each Group (Batch)
                  </button>
                  {format === "spritesheet" && (
                    <button
                      onClick={() => setSelectedGroupId("all-combined")}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                        selectedGroupId === "all-combined"
                          ? "bg-primary-600 text-neutral-100 border-primary-600"
                          : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                      }`}
                    >
                      All Groups (Combined)
                    </button>
                  )}
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                        selectedGroupId === g.id
                          ? "bg-primary-600 text-neutral-100 border-primary-600"
                          : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                      }`}
                    >
                      {g.name} ({g.frameIndices.length}f)
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Scale */}
          {format !== "pixecute" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Scale
              </label>
              <div className="flex gap-2">
                {scalePresets.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      scale === s
                        ? "bg-primary-600 text-neutral-100 border-primary-600"
                        : "bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frame Selection — for PNG and JPG only */}
          {(format === "png" || format === "jpg") && totalFrames > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Frame
              </label>
              <div className="flex items-center gap-3 p-3 bg-neutral-200 rounded-lg">
                <input
                  type="checkbox"
                  id="export-all-frames"
                  checked={exportAllFrames}
                  onChange={(e) => setExportAllFrames(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-600"
                />
                <label
                  htmlFor="export-all-frames"
                  className="text-sm text-neutral-700 cursor-pointer"
                >
                  Export all {totalFrames} frames as separate files
                </label>
              </div>
              {!exportAllFrames && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={totalFrames}
                    value={frameIndex + 1}
                    onChange={(e) =>
                      setFrameIndex(
                        Math.max(
                          0,
                          Math.min(
                            totalFrames - 1,
                            parseInt(e.target.value || "1") - 1,
                          ),
                        ),
                      )
                    }
                    className="w-20 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:border-primary-600"
                  />
                  <span className="text-sm text-neutral-600">
                    of {totalFrames}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* JPG-specific options */}
          {format === "jpg" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Quality: {Math.round(jpgQuality * 100)}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(jpgQuality * 100)}
                  onChange={(e) =>
                    setJpgQuality(parseInt(e.target.value) / 100)
                  }
                  className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={jpgBackground}
                    onChange={(e) => setJpgBackground(e.target.value)}
                    className="w-10 h-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-600 font-mono">
                    {jpgBackground}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sprite Sheet options */}
          {format === "spritesheet" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Columns (0 = auto)
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalFrames}
                  value={spriteColumns}
                  onChange={(e) =>
                    setSpriteColumns(parseInt(e.target.value) || 0)
                  }
                  className="w-20 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:outline-none focus:border-primary-600"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-neutral-200 rounded-lg">
                <input
                  type="checkbox"
                  id="include-metadata"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-600"
                />
                <label
                  htmlFor="include-metadata"
                  className="text-sm text-neutral-700 cursor-pointer"
                >
                  Include JSON metadata
                </label>
              </div>
            </div>
          )}

          {/* Progress */}
          {isExporting && format === "gif" && (
            <div className="space-y-1">
              <div className="text-sm text-neutral-600">
                Encoding GIF... {progress}%
              </div>
              <div className="w-full h-2 bg-neutral-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-neutral-300 bg-neutral-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <IconDownload size={16} />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
};
