import { DrawingTool, FileTool } from "@/types/canvas";
import {
  IconArrowsMove,
  IconEraser,
  IconFilePlus,
  IconMarquee2,
  IconPencil,
  IconUpload,
} from "@tabler/icons-react";
import { PaintBucket, Pipette } from "lucide-react";

export const FILE_TOOLS: FileTool[] = [
  {
    name: "New",
    icon: <IconFilePlus size={26} />,
  },
  {
    name: "Export",
    icon: <IconUpload size={26} />,
  },
];

export const DRAWING_TOOLS: DrawingTool[] = [
  {
    name: "Select",
    icon: <IconMarquee2 size={30} />,
    trigger: "down",
  },
  {
    name: "Pencil",
    icon: <IconPencil size={30} />,
    trigger: "down",
  },
  // {
  //   name: "Brush",
  //   icon: <IconBrush size={32} />,
  //   trigger: "down",
  //   subTools: [
  //     {
  //       name: "Brush",
  //       icon: <IconBrush size={32} />,
  //     },
  //   ],
  // },
  {
    name: "Picker",
    icon: <Pipette size={28} />,
    trigger: "up",
  },
  {
    name: "Eraser",
    icon: <IconEraser size={30} />,
    trigger: "down",
  },
  {
    name: "Fill",
    icon: <PaintBucket size={28} style={{ transform: "scaleX(-1)" }} />,
    trigger: "up",
  },
  // {
  //   name: "Line",
  //   icon: <IconLine size={30} />,
  //   trigger: "down",
  // },
  // {
  //   name: "Shape",
  //   icon: <IconShape size={30} />,
  //   trigger: "down",
  // },
  {
    name: "Move",
    icon: <IconArrowsMove size={30} />,
    trigger: "down",
  },
];
