import { DrawingTool } from "@/types/canvas";

import { Droplet, PaintBucket, Pipette } from "lucide-react";
import {
  IconArrowsMove,
  IconEraser,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";

interface CustomPointerProps {
  currentTool: number;
  pixelReference: number;
  mouseInCanvas: boolean;
  mousePosition: { x: number; y: number };
}

// 0: select, 1: pencil, 2: picker, 3: eraser, 4: fill, 5: move
export const CustomPointer = ({
  currentTool = 1,
  pixelReference = 1,
  mouseInCanvas = false,
  mousePosition = { x: 0, y: 0 },
}: CustomPointerProps) => {
  switch (currentTool) {
    case 0:
      return (
        <IconPlus
          size={25}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      );
    case 2:
      return (
        <Pipette
          size={25}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + 12 + "px",
            top: mousePosition.y - 10 + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      );
    case 3:
      return (
        <IconEraser
          size={25}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + 3 + "px",
            top: mousePosition.y - 9 + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      );
    case 4:
      return (
        <PaintBucket
          size={25}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + 9 + "px",
            top: mousePosition.y - 10 + "px",
            transform: `translate(-50%, -50%) scale(-1, 1)`,
          }}
        />
      );
    case 5:
      return (
        <IconArrowsMove
          size={30}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      );
    default:
      return (
        <IconPencil
          size={25}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + 10 + "px",
            top: mousePosition.y - 8 + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      );
  }
};
