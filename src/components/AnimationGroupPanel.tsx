"use client";

import React, { useState } from "react";
import useArtStore from "@/utils/Zustand";
import { AnimationGroup } from "@/types/canvas";
import {
  addAnimationGroup,
  deleteAnimationGroup,
  updateAnimationGroup,
  addFrameToGroup,
  removeFrameFromGroup,
  PRESET_GROUP_NAMES,
} from "@/utils/AnimationGroups";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

interface AnimationGroupPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onPlayGroup?: (group: AnimationGroup) => void;
}

export const AnimationGroupPanel = ({
  isOpen,
  onToggle,
  onPlayGroup,
}: AnimationGroupPanelProps) => {
  const liveArtwork = useArtStore((s) => s.liveArtwork);
  const setLiveArtwork = useArtStore((s) => s.setLiveArtwork);
  const setHasChanged = useArtStore((s) => s.setHasChanged);
  const pushToHistory = useArtStore((s) => s.pushToHistory);
  const selectedFrame = useArtStore((s) => s.selectedFrame);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const groups = liveArtwork?.groups ?? [];
  const totalFrames = liveArtwork?.frames?.length ?? 0;

  const handleAddGroup = (name: string) => {
    pushToHistory("Add animation group");
    const updated = addAnimationGroup(liveArtwork, name);
    setLiveArtwork(updated);
    setHasChanged(true);
    setShowPresets(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    pushToHistory("Delete animation group");
    const updated = deleteAnimationGroup(liveArtwork, groupId);
    setLiveArtwork(updated);
    setHasChanged(true);
  };

  const handleRenameGroup = (groupId: string) => {
    if (!editName.trim()) return;
    pushToHistory("Rename animation group");
    const updated = updateAnimationGroup(liveArtwork, groupId, {
      name: editName.trim(),
    });
    setLiveArtwork(updated);
    setHasChanged(true);
    setEditingId(null);
  };

  const handleToggleFrame = (groupId: string, frameIndex: number) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    pushToHistory("Update animation group frames");
    const updated = group.frameIndices.includes(frameIndex)
      ? removeFrameFromGroup(liveArtwork, groupId, frameIndex)
      : addFrameToGroup(liveArtwork, groupId, frameIndex);
    setLiveArtwork(updated);
    setHasChanged(true);
  };

  const handleToggleLoop = (groupId: string, loop: boolean) => {
    const updated = updateAnimationGroup(liveArtwork, groupId, { loop });
    setLiveArtwork(updated);
    setHasChanged(true);
  };

  const handleTogglePingPong = (groupId: string, pingPong: boolean) => {
    const updated = updateAnimationGroup(liveArtwork, groupId, { pingPong });
    setLiveArtwork(updated);
    setHasChanged(true);
  };

  // Assign current frame to a group quickly
  const handleAssignCurrentFrame = (groupId: string) => {
    handleToggleFrame(groupId, selectedFrame);
  };

  return (
    <div className="pointer-events-auto">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 text-neutral-200 rounded-t-lg text-xs font-medium hover:bg-neutral-700 transition-colors"
      >
        {isOpen ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
        Groups ({groups.length})
      </button>

      {isOpen && (
        <div className="bg-neutral-100 border border-neutral-300 rounded-b-lg rounded-tr-lg shadow-xl max-w-md w-80 max-h-64 overflow-y-auto">
          {/* Group List */}
          {groups.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              No animation groups yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {groups.map((group) => (
                <div key={group.id} className="p-2 space-y-1.5">
                  {/* Group Header */}
                  <div className="flex items-center gap-1">
                    {editingId === group.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameGroup(group.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded bg-neutral-50 focus:outline-none focus:border-primary-600"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameGroup(group.id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <IconCheck size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-neutral-500 hover:bg-neutral-200 rounded"
                        >
                          <IconX size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-neutral-800 capitalize">
                          {group.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {group.frameIndices.length}f
                        </span>
                        {onPlayGroup && group.frameIndices.length > 0 && (
                          <button
                            onClick={() => onPlayGroup(group)}
                            className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                            title="Play this group"
                          >
                            <IconPlayerPlay size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(group.id);
                            setEditName(group.name);
                          }}
                          className="p-1 text-neutral-500 hover:bg-neutral-200 rounded"
                          title="Rename"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Delete group"
                        >
                          <IconTrash size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Frame Assignment Row */}
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: totalFrames }, (_, i) => {
                      const isInGroup = group.frameIndices.includes(i);
                      const isCurrentFrame = i === selectedFrame;
                      return (
                        <button
                          key={i}
                          onClick={() => handleToggleFrame(group.id, i)}
                          className={`w-6 h-6 text-xs rounded border transition-colors ${
                            isInGroup
                              ? "bg-primary-600 text-neutral-100 border-primary-600"
                              : isCurrentFrame
                                ? "bg-neutral-300 text-neutral-700 border-neutral-400"
                                : "bg-neutral-200 text-neutral-600 border-neutral-300 hover:bg-neutral-300"
                          }`}
                          title={`Frame ${i + 1}${isInGroup ? " (in group)" : ""}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Group Settings */}
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.loop}
                        onChange={(e) =>
                          handleToggleLoop(group.id, e.target.checked)
                        }
                        className="w-3 h-3"
                      />
                      <span className="text-neutral-600">Loop</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.pingPong}
                        onChange={(e) =>
                          handleTogglePingPong(group.id, e.target.checked)
                        }
                        className="w-3 h-3"
                      />
                      <span className="text-neutral-600">Ping-Pong</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Group */}
          <div className="p-2 border-t border-neutral-200">
            {showPresets ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {PRESET_GROUP_NAMES.filter(
                    (name) => !groups.some((g) => g.name === name),
                  ).map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAddGroup(name)}
                      className="px-2 py-1 text-xs bg-neutral-200 hover:bg-primary-600 hover:text-neutral-100 text-neutral-700 rounded border border-neutral-300 transition-colors capitalize"
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Custom name..."
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded bg-neutral-50 focus:outline-none focus:border-primary-600"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        handleAddGroup(e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={() => setShowPresets(false)}
                    className="px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-200 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPresets(true)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                <IconPlus size={14} />
                Add Group
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
