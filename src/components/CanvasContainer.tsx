"use client";

import React, { useEffect, useRef, useState } from "react";

import CreateGrid from "@/utilities/CreateGrid";
import {
  colourObjectToRGBA,
  hexToHsl,
  rgbToHex,
  rgbToHsl,
} from "@/utilities/ColourUtils";

import {
  IconColorPicker,
  IconEraser,
  IconPaintFilled,
  IconPencil,
} from "@tabler/icons-react";
import { drawPixel, fillPixel } from "@/utilities/ArtToolsUtils";

interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

type RawColour = Uint8ClampedArray;
type ColourObject = { colour: {}; alpha: number };
type GetColourResponse = RawColour | ColourObject;
type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

interface ArtTool {
  name: string;
  icon: React.ReactNode;
  trigger?: "up" | "down";
  subTools?: ArtTool[];
}

interface CanvasEditorProps {
  setColour?: (colour: string, alpha: number) => void;
  currentColour?: ColourObject;
  currentTool?: ArtTool;
  config?: CanvasConfig;
}

const CanvasContainer = ({
  setColour = () => {},
  currentColour = { colour: "#000", alpha: 255 },
  currentTool = {
    name: "Pencil",
    icon: <IconPencil size={24} />,
    trigger: "down",
  },
  config = { width: 32, height: 16, background: "transparent" },
}: CanvasEditorProps) => {
  // States
  const [loading, setLoading] = useState(true);

  const [lastClick, setLastClick] = useState(0);
  const [mouseInCanvas, setMouseInCanvas] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [pixelSize, setPixelSize] = useState({ x: 0, y: 0 });

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  // Refs
  const cursorRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const grid = CreateGrid(config.height, config.width);

  const activateTool = (x: number, y: number) => {
    switch (currentTool.name) {
      case "Pencil":
        return drawPixel(
          x,
          y,
          pixelSize,
          currentColour,
          canvasRef.current!,
          contextRef.current!,
        );
      case "Picker":
        return pickerPixel(x, y);
      case "Eraser":
        return erasePixel(x, y);
      case "Fill":
        return fillPixel(
          x,
          y,
          pixelSize,
          config.width,
          config.height,
          currentColour,
          canvasRef.current!,
          contextRef.current!,
        );
      default:
        return drawPixel(
          x,
          y,
          pixelSize,
          currentColour,
          canvasRef.current!,
          contextRef.current!,
        );
    }
  };

  const getToolIcon = () => {
    switch (currentTool.name) {
      case "Pencil":
        return (
          <IconPencil
            size={26}
            className={`stroke-[1.35px] ${
              hexToHsl(currentColour.colour as string).l >= 50
                ? "text-neutral-800"
                : "text-neutral-100"
            }`}
            style={{
              fill: currentColour.colour as string,
              transform: "translate(-15%, -80%)",
            }}
          />
        );
      case "Picker":
        return (
          <div className={`relative`}>
            <div
              className={`absolute -top-1 right-1 w-2.5 h-2.5 rounded-full border-[2px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "border-neutral-800"
                  : "border-neutral-100"
              }`}
              style={{
                backgroundColor: currentColour.colour as string,
              }}
            ></div>
            <IconColorPicker
              size={26}
              className={`stroke-[1.35px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "text-neutral-800"
                  : "text-neutral-100"
              }`}
              style={{
                transform: "translate(-15%, -80%)",
              }}
            />
          </div>
        );
      case "Eraser":
        return (
          <IconEraser
            size={26}
            className={`stroke-[1.35px] ${
              hexToHsl(currentColour.colour as string).l >= 50
                ? "text-neutral-800"
                : "text-neutral-100"
            }`}
            style={{
              fill: "white",
              transform: "translate(-40%, -80%)",
            }}
          />
        );
      case "Fill":
        return (
          <div className={`relative flex flex-col items-center`}>
            <div
              className={`absolute top-0 left-0 w-2 h-2 border-neutral-900`}
              style={{
                backgroundColor: currentColour.colour as string,
                clipPath: "polygon(0 0, 100% 100%, 100% 0%)",
                transform: "translate(0%, -100%) rotateZ(180deg)",
              }}
            ></div>
            <IconPaintFilled
              size={26}
              className={`stroke-[1.35px] ${
                hexToHsl(currentColour.colour as string).l >= 50
                  ? "text-neutral-800"
                  : "text-neutral-100"
              } `}
              style={{
                fill: currentColour.colour as string,
                transform: "translate(0%, -100%)",
              }}
            />
          </div>
        );
      default:
        return (
          <IconPencil
            size={26}
            className={`stroke-[1.35px]`}
            style={{ fill: currentColour.colour as string }}
          />
        );
    }
  };

  const saveImageToSession = (value: string) => {
    sessionStorage.setItem("currentImage", value);
  };

  const getImageFromSession = (key: string) => {
    return sessionStorage.getItem(key);
  };

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent,
  ) => {
    const rect = canvas.getBoundingClientRect();

    if (event instanceof MouseEvent) {
      return {
        x: Math.floor((event.clientX - rect.left) / (pixelSize.x * canvasZoom)),
        y: Math.floor((event.clientY - rect.top) / (pixelSize.y * canvasZoom)),
      };
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      return {
        x: Math.floor((touch.clientX - rect.left) / pixelSize.x),
        y: Math.floor((touch.clientY - rect.top) / pixelSize.y),
      };
    }

    return { x: 0, y: 0 };
  };

  interface GetColourProps {
    x: number;
    y: number;
    response: ColourFormat;
  }

  const getColourAtPixel = (
    x: number,
    y: number,
    response: ColourFormat,
  ): GetColourResponse => {
    const context = contextRef.current!;
    const imageData = context.getImageData(
      x * pixelSize.x,
      y * pixelSize.y,
      1,
      1,
    ).data;

    switch (response) {
      case "raw":
        return imageData;
      case "hex":
        return {
          colour: rgbToHex({
            r: imageData[0],
            g: imageData[1],
            b: imageData[2],
          }).toUpperCase(),
          alpha: imageData[3],
        };
      case "rgb":
        return {
          colour: {
            r: imageData[0],
            g: imageData[1],
            b: imageData[2],
          },
          alpha: imageData[3],
        };
      case "hsl":
        return {
          colour: rgbToHsl({
            r: imageData[0],
            g: imageData[1],
            b: imageData[2],
          }),
          alpha: imageData[3],
        };
      default:
        return imageData;
    }
  };

  const pickerPixel = (x: number, y: number) => {
    let pickedData = getColourAtPixel(x, y, "hex") as ColourObject;

    const newColour = pickedData.colour as string;
    setColour(newColour.toUpperCase(), pickedData.alpha);
  };

  const erasePixel = (x: number, y: number) => {
    const context = contextRef.current!;
    context.clearRect(
      Math.round(x * pixelSize.x),
      Math.round(y * pixelSize.y),
      Math.round(pixelSize.x),
      Math.round(pixelSize.y),
    );

    // Update Canvas Data
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL();
    saveImageToSession(dataUrl);
  };

  const compareColourObjects = (a: ColourObject, b: ColourObject) => {
    return (
      a.colour.toString().toUpperCase() === b.colour.toString().toLowerCase() &&
      a.alpha === b.alpha
    );
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    event.preventDefault();

    if (event.button === 0) {
      setIsDrawing(true);
      activateTool(x, y);
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    setZoomCenter({ x: event.clientX, y: event.clientY });
    setCanvasZoom((prevScale) =>
      Math.max(0.1, prevScale - event.deltaY * 0.001),
    );
  };

  const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    if (isDrawing) activateTool(x, y);
  };

  const touchDraw = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const { x, y } = getMousePosition(canvasRef.current!, event.nativeEvent);
    if (isDrawing) activateTool(x, y);
  };

  const handleResize = () => {
    setCanvasZoom(1);

    const canvas: HTMLCanvasElement = canvasRef.current!;
    const wrapper: HTMLDivElement = wrapperRef.current!;

    if (!canvas) return;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const wrapperRatio = wrapperWidth / wrapperHeight;
    const artworkRatio = config.width / config.height;

    // Default Pixel Size to Square for now (instead of pixelWidth x pixelHeight)
    let squarePixelSize = 0;
    let prelimCanvasWidth = 0;
    let prelimCanvasHeight = 0;

    if (wrapperRatio <= artworkRatio) {
      canvas.style.width = `100%`;
      prelimCanvasWidth = Math.floor(wrapperWidth);
      squarePixelSize = prelimCanvasWidth / config.width;
    } else {
      canvas.style.height = `100%`;
      prelimCanvasHeight = Math.floor(wrapperHeight);
      squarePixelSize = prelimCanvasHeight / config.height;
    }

    squarePixelSize = Math.floor(squarePixelSize);
    canvas.width = squarePixelSize * config.width;
    canvas.height = squarePixelSize * config.height;

    // Set Pixel Size - default to square for now
    setPixelSize({ x: squarePixelSize, y: squarePixelSize });

    // // Redraw Image
    const canvasData = getImageFromSession("currentImage");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (context) {
      contextRef.current = context;
      context.imageSmoothingEnabled = false;
    }

    if (canvasData && context) {
      const img = new Image();
      img.src = canvasData;

      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }

    setLoading(false);
  };

  useEffect(() => {
    saveImageToSession("");
    const canvas = canvasRef.current!;

    if (!canvas) return;
    handleResize();
  }, []);

  return (
    <>
      <section
        ref={wrapperRef}
        className={`mx-auto w-full h-full z-10`}
        style={{
          transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`,
          transform: ` scale(${canvasZoom})`,
        }}
      >
        <article
          className={`mx-auto relative w-fit h-fit  ${
            loading ? "opacity-0" : "opacity-100"
          } transition-all duration-300`}
          onMouseEnter={() => setMouseInCanvas(true)}
          onMouseDown={(event: React.MouseEvent<HTMLCanvasElement>) => {
            if (currentTool.trigger === "down") startDrawing(event);
          }}
          onMouseUp={(event: React.MouseEvent<HTMLCanvasElement>) => {
            if (event.button === 0) {
              if (currentTool.trigger === "up") startDrawing(event);
            } else if (event.button === 1) {
              const now = Date.now();

              if (now - lastClick < 500) {
                handleResize();
              } else setLastClick(now);
            }

            finishDrawing();
          }}
          onWheel={handleWheel}
          onMouseLeave={() => {
            finishDrawing();
            setMouseInCanvas(false);
          }}
          onMouseMove={(event: React.MouseEvent<HTMLCanvasElement>) => {
            let { clientX, clientY } = event.nativeEvent;

            if (cursorRef.current) {
              cursorRef.current!.style.left = clientX + "px";
              cursorRef.current!.style.top = clientY + "px";
            }

            mouseDraw(event);
          }}
          onContextMenu={(event) => event.preventDefault()}
          onTouchStart={() => setIsDrawing(true)}
          onTouchEnd={finishDrawing}
          onTouchMove={touchDraw}
        >
          {/* Background */}
          <div
            className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full bg-${config.background} z-0`}
          >
            {config.background === "transparent" &&
              grid.map((row, rowIndex) => (
                <div
                  key={`transparent-row-${rowIndex}`}
                  className={`flex w-full grow`}
                >
                  {row.map((col, colIndex) => (
                    <div
                      key={`transparent-col-${colIndex}`}
                      className={`grow ${
                        (rowIndex + colIndex) % 2 === 0
                          ? "bg-neutral-400/60"
                          : "bg-neutral-600/60"
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
          </div>

          <canvas
            ref={canvasRef}
            id={"canvas"}
            className={`cursor-none relative ${
              loading ? "opacity-0" : "opacity-100"
            } z-50 transition-all duration-300`}
            style={{
              aspectRatio: config.width / config.height,
              imageRendering: "pixelated",
            }}
          ></canvas>

          {/*<div*/}
          {/*  id={"guide"}*/}
          {/*  className={`pointer-events-none absolute top-0 left-0 ${*/}
          {/*    showGrid ? "opacity-100" : "opacity-0"*/}
          {/*  } grid w-full h-full transition-all duration-300 z-0`}*/}
          {/*  style={{*/}
          {/*    gridTemplateColumns: `repeat(${config.width}, 1fr)`,*/}
          {/*    gridTemplateRows: `repeat(${config.height}, 1fr)`,*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {Array.from(Array(config.width * config.height)).map((_, index) => (*/}
          {/*    <div*/}
          {/*      key={`canvas-grid-${index}`}*/}
          {/*      className={` border-[1px] border-dotted border-neutral-100/30`}*/}
          {/*    ></div>*/}
          {/*  ))}*/}
          {/*</div>*/}
        </article>
      </section>

      <div
        ref={cursorRef}
        className={`pointer-events-none absolute ${
          mouseInCanvas ? "block" : "hidden"
        } z-50`}
      >
        {getToolIcon()}
      </div>
    </>
  );
};

export default CanvasContainer;

interface CanvasLayerProps {
  ref: React.RefObject<HTMLCanvasElement>;
  config: CanvasConfig;
  onMouseDown: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseUp: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseMove: React.MouseEventHandler<HTMLCanvasElement>;
  onContextMenu: React.MouseEventHandler<HTMLCanvasElement>;
  onTouchStart: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchEnd: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchMove: React.TouchEventHandler<HTMLCanvasElement>;
}

const CanvasLayer = ({
  ref,
  config,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onMouseMove,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
}: CanvasLayerProps) => {
  return (
    <canvas
      ref={ref}
      className={`cursor-none relative w-full h-full z-50`}
      style={{
        aspectRatio: config.width / config.height,
      }}
      id={"canvas"}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    ></canvas>
  );
};
