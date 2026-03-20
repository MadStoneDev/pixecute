import { DrawingTool, FileTool, ToolId } from "@/types/canvas";

import {
  IconArrowsMove,
  IconCloud,
  IconEraser,
  IconFilePlus,
  IconLine,
  IconMarquee2,
  IconPencil,
  IconRectangle,
  IconSettings,
  IconUpload,
} from "@tabler/icons-react";
import { PaintBucket, Pipette } from "lucide-react";

export const FILE_TOOLS: FileTool[] = [
  {
    name: "New",
    icon: <IconFilePlus size={22} />,
  },
  {
    name: "Export",
    icon: <IconUpload size={22} />,
  },
  {
    name: "Cloud Save",
    icon: <IconCloud size={22} />,
  },
  {
    name: "",
    icon: <IconSettings size={22} />,
  },
];

export const DRAWING_TOOLS: DrawingTool[] = [
  {
    id: "select",
    name: "Select",
    icon: <IconMarquee2 size={30} />,
    trigger: "down",
  },
  {
    id: "pencil",
    name: "Pencil",
    icon: <IconPencil size={30} />,
    trigger: "down",
  },
  {
    id: "picker",
    name: "Picker",
    icon: <Pipette size={28} />,
    trigger: "up",
    doAfter: true,
  },
  {
    id: "eraser",
    name: "Eraser",
    icon: <IconEraser size={30} />,
    trigger: "down",
  },
  {
    id: "fill",
    name: "Fill",
    icon: <PaintBucket size={28} style={{ transform: "scaleX(-1)" }} />,
    trigger: "up",
  },
  {
    id: "move",
    name: "Move",
    icon: <IconArrowsMove size={30} />,
    trigger: "down",
  },
  {
    id: "line",
    name: "Line",
    icon: <IconLine size={30} />,
    trigger: "down",
  },
  {
    id: "rectangle",
    name: "Rectangle",
    icon: <IconRectangle size={30} />,
    trigger: "down",
  },
];

// Helper: look up a tool by its ID
export const getToolById = (id: ToolId): DrawingTool | undefined =>
  DRAWING_TOOLS.find((t) => t.id === id);
