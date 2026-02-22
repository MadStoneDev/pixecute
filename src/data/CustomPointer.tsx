import { forwardRef, useImperativeHandle, useRef } from "react";
import { ToolId } from "@/types/canvas";

import { PaintBucket, Pipette } from "lucide-react";
import {
  IconArrowsMove,
  IconEraser,
  IconLine,
  IconPencil,
  IconPlus,
  IconRectangle,
} from "@tabler/icons-react";

export interface CustomPointerHandle {
  updatePosition: (x: number, y: number) => void;
  setVisible: (visible: boolean) => void;
}

interface CustomPointerProps {
  currentTool: ToolId;
}

const POINTER_CONFIGS: Record<
  ToolId,
  {
    icon: React.FC<{
      size: number;
      className: string;
      style: React.CSSProperties;
    }>;
    size: number;
    offsetX: number;
    offsetY: number;
  }
> = {
  select: { icon: IconPlus as any, size: 25, offsetX: 0, offsetY: 0 },
  pencil: { icon: IconPencil as any, size: 25, offsetX: 10, offsetY: -8 },
  picker: { icon: Pipette as any, size: 25, offsetX: 12, offsetY: -10 },
  eraser: { icon: IconEraser as any, size: 25, offsetX: 3, offsetY: -9 },
  fill: { icon: PaintBucket as any, size: 25, offsetX: 9, offsetY: -10 },
  move: { icon: IconArrowsMove as any, size: 30, offsetX: 0, offsetY: 0 },
  line: { icon: IconLine as any, size: 25, offsetX: 10, offsetY: -8 },
  rectangle: { icon: IconRectangle as any, size: 25, offsetX: 10, offsetY: -8 },
};

export const CustomPointer = forwardRef<CustomPointerHandle, CustomPointerProps>(
  ({ currentTool = "pencil" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const config = POINTER_CONFIGS[currentTool] || POINTER_CONFIGS.pencil;
    const Icon = config.icon;

    useImperativeHandle(ref, () => ({
      updatePosition: (x: number, y: number) => {
        if (containerRef.current) {
          containerRef.current.style.left = x + config.offsetX + "px";
          containerRef.current.style.top = y + config.offsetY + "px";
        }
      },
      setVisible: (visible: boolean) => {
        if (containerRef.current) {
          containerRef.current.style.display = visible ? "block" : "none";
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        className="pointer-events-none fixed z-50"
        style={{
          display: "none",
          transform:
            currentTool === "fill"
              ? `translate(-50%, -50%) scale(-1, 1)`
              : `translate(-50%, -50%)`,
          willChange: "left, top",
        }}
      >
        <Icon
          size={config.size}
          className="text-neutral-100"
          style={{}}
        />
      </div>
    );
  },
);

CustomPointer.displayName = "CustomPointer";
