"use client";

import React, { useEffect, useRef, useState } from "react";

import useArtStore from "@/utils/Zustand";
import { hexToHsl, hexToRgb, hslToHex, rgbToHex } from "@/utils/Colour";

import {
  IconX,
  IconCheck,
  IconPalette,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { HexColorPicker } from "react-colorful";

interface ColourPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialColour?: string;
  onColourSelect: (colour: string) => void;
}

// Sortable color item component
const SortableColorItem = ({
  colour,
  index,
  onEdit,
  onDelete,
}: {
  colour: string;
  index: number;
  onEdit: (index: number, colour: string) => void;
  onDelete: (index: number) => void;
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(colour);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: colour + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      onEdit(index, editValue);
      setEditMode(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-neutral-200 rounded-lg group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-900"
      >
        <IconGripVertical size={16} />
      </div>

      <div
        className="w-8 h-8 rounded border border-neutral-300 flex-shrink-0 cursor-pointer"
        style={{ backgroundColor: colour }}
        onClick={() => setEditMode(true)}
      />

      {editMode ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded bg-neutral-100 font-mono uppercase"
            maxLength={7}
            placeholder="#000000"
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
          >
            <IconCheck size={14} />
          </button>
          <button
            onClick={() => {
              setEditMode(false);
              setEditValue(colour);
            }}
            className="p-1 text-neutral-600 hover:bg-neutral-300 rounded"
          >
            <IconX size={14} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-700 uppercase">
            {colour}
          </span>
          <button
            onClick={() => onDelete(index)}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
          >
            <IconTrash size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export const ColourPickerModal = ({
  isOpen,
  onClose,
  initialColour = "#000000",
  onColourSelect,
}: ColourPickerModalProps) => {
  const [currentColour, setCurrentColour] = useState(initialColour);
  const [hexInput, setHexInput] = useState(initialColour);
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
  const [activeTab, setActiveTab] = useState<"picker" | "palette">("picker");

  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const { colourPalette, setColourPalette, addColourToPalette } = useArtStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (initialColour) {
      setCurrentColour(initialColour);
      setHexInput(initialColour.toUpperCase());
      updateFromHex(initialColour);
    }
  }, [initialColour]);

  const updateFromHex = (hex: string) => {
    try {
      const hslColour = hexToHsl(hex);
      setHsl(hslColour);
    } catch (error) {
      console.error("Invalid hex colour:", hex);
    }
  };

  const updateFromHSL = (newHsl: { h: number; s: number; l: number }) => {
    const hex = hslToHex(newHsl);
    setCurrentColour(hex);
    setHexInput(hex.toUpperCase());
    setHsl(newHsl);
  };

  const handleSaturationClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const s = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const l = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    updateFromHSL({ ...hsl, s, l });
  };

  const handleHueClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const h = Math.max(0, Math.min(360, (x / rect.width) * 360));
    updateFromHSL({ ...hsl, h });
  };

  const handleHexChange = (value: string) => {
    // Ensure we always have a # prefix
    const formattedValue = value.startsWith("#") ? value : "#" + value;

    setHexInput(formattedValue);

    // Validate hex format and update colour
    if (formattedValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      setCurrentColour(formattedValue);
      updateFromHex(formattedValue);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = colourPalette.findIndex(
        (colour, index) => colour + index === active.id,
      );
      const newIndex = colourPalette.findIndex(
        (colour, index) => colour + index === over.id,
      );
      setColourPalette(arrayMove(colourPalette, oldIndex, newIndex));
    }
  };

  const handleEditColour = (index: number, newColour: string) => {
    const newPalette = [...colourPalette];
    newPalette[index] = newColour;
    setColourPalette(newPalette);
  };

  const handleDeleteColour = (index: number) => {
    const newPalette = colourPalette.filter((_, i) => i !== index);
    setColourPalette(newPalette);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-100 rounded-2xl w-[380px] max-h-[600px] overflow-hidden border border-neutral-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-neutral-100">
          <div className="flex items-center gap-2">
            <IconPalette size={20} />
            <h3 className="font-medium">Colours</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-700 rounded transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-300">
          <button
            onClick={() => setActiveTab("picker")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "picker"
                ? "bg-primary-600 text-neutral-100"
                : "text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Colour Picker
          </button>
          <button
            onClick={() => setActiveTab("palette")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "palette"
                ? "bg-primary-600 text-neutral-100"
                : "text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Palette ({colourPalette.length})
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {activeTab === "picker" ? (
            <>
              <HexColorPicker
                color={currentColour}
                onChange={handleHexChange}
                style={{ width: "100%", height: "150px" }}
              />

              {/* Hex Input */}
              <div className="px-3 py-2 flex items-center gap-3 bg-neutral-200 rounded-xl ">
                <span className="text-neutral-400 font-mono text-sm">HEX</span>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(
                      /[^0-9A-Fa-f]/g,
                      "",
                    ); // Only allow hex characters
                    handleHexChange(inputValue);
                  }}
                  className="flex-1 font-mono uppercase bg-transparent focus:outline-none text-neutral-900"
                  maxLength={6}
                  placeholder="#000000"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {colourPalette.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={colourPalette.map((colour, index) => colour + index)}
                    strategy={verticalListSortingStrategy}
                  >
                    {colourPalette.map((colour, index) => (
                      <SortableColorItem
                        key={colour + index}
                        colour={colour}
                        index={index}
                        onEdit={handleEditColour}
                        onDelete={handleDeleteColour}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <IconPalette size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No colours in palette</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-4 border-t border-neutral-300 bg-neutral-50">
          <button
            onClick={() => {
              onColourSelect(currentColour);
              onClose();
            }}
            className="px-4 py-2 text-sm bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded-lg transition-colors"
          >
            Use Colour
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-neutral-300 hover:bg-neutral-400 text-neutral-900 rounded-lg transition-colors"
            >
              Close
            </button>
            {activeTab === "picker" && (
              <button
                onClick={() => addColourToPalette(currentColour)}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-neutral-100 rounded-lg transition-colors"
              >
                Add to Palette
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
