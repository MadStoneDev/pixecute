"use client";

import React, {
  useRef,
  useState,
  useEffect,
  RefObject,
  createRef,
} from "react";

import { useGesture } from "@use-gesture/react";
import { NewArtworkObject } from "@/data/ArtworkObject";

import {
  ArtTool,
  ArtworkObject,
  CanvasConfig,
  ColourObject,
} from "@/types/canvas";
import CanvasLayer from "@/components/CanvasLayer";
import { hexToHsl } from "@/utilities/ColourUtils";

import {
  IconColorPicker,
  IconEraser,
  IconPaint,
  IconPaintFilled,
  IconPencil,
  IconSquareRoundedPlusFilled,
} from "@tabler/icons-react";

import {
  drawPixel,
  drawTransparentGrid,
  erasePixel,
  fillCanvas,
  fillPixel,
  pickerPixel,
  updatePreviewWindow,
} from "@/utilities/ArtToolsUtils";

import {
  addNewLayer,
  addNewFrame,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  deleteFrame,
  loadArtworkFromSession,
  hasImageDataChanged,
  imageDataToJSON,
  jsonToImageData,
  loadArtworkHistoryFromSession,
  saveArtworkHistoryToSession,
} from "@/utilities/LayerUtils";

interface CanvasEditorProps {
  className?: string;
  setColour?: (colour: string, alpha: number) => void;
  currentColour?: ColourObject;
  currentTool?: ArtTool;
  config?: CanvasConfig;
}

const CanvasContainer = ({
  className = "",
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
  const [pixelSize, setPixelSize] = useState({ x: 0, y: 0 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastClick, setLastClick] = useState(0);
  const [mouseInCanvas, setMouseInCanvas] = useState(false);

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  const [activeFrame, setActiveFrame] = useState(1);
  const [activeLayer, setActiveLayer] = useState(0);
  const [artworkObject, setArtworkObject] =
    useState<ArtworkObject>(NewArtworkObject);

  // Refs
  const cursorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Layer-Related Refs
  const layerRefs = useRef<RefObject<HTMLCanvasElement>[]>([
    createRef<HTMLCanvasElement>(),
  ]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const transparentBackgroundRef = useRef<HTMLCanvasElement>(null);

  // History Functions
  const saveToHistory = (newArtworkObject: ArtworkObject) => {
    const historyData = loadArtworkHistoryFromSession("history") || [];
    let historyPointer = parseInt(
      sessionStorage.getItem("historyPointer") || "0",
      10,
    );

    // Initialise new history array
    let newHistoryData: ArtworkObject[] = [];

    if (historyPointer < historyData.length - 1) {
      // On change, clear any history that is newer than the current
      newHistoryData = historyData.slice(0, historyPointer + 1);
    } else {
      newHistoryData = historyData;
    }

    // add new history entry
    newHistoryData.push(newArtworkObject);
    saveArtworkHistoryToSession(newHistoryData, "history");

    // move pointer to end of history
    historyPointer = newHistoryData.length - 1;
    sessionStorage.setItem("historyPointer", historyPointer.toString());
  };

  const activateTool = (x: number, y: number) => {
    const currentLayer = layerRefs.current[activeLayer].current;
    const currentContext = currentLayer?.getContext("2d");

    if (!currentLayer || !currentContext) return;
    const newArtworkObject: ArtworkObject = { ...artworkObject };

    switch (currentTool.name) {
      case "Pencil":
        drawPixel(
          x,
          y,
          pixelSize,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          activeLayer,
          activeFrame,
        );
        break;

      case "Picker":
        const { colour, alpha } = pickerPixel(x, y, pixelSize, currentContext);

        setColour(colour, alpha);
        break;

      case "Eraser":
        erasePixel(
          x,
          y,
          pixelSize,
          currentLayer,
          currentContext,
          newArtworkObject,
          activeLayer,
          activeFrame,
        );
        break;

      case "Fill":
        fillPixel(
          x,
          y,
          pixelSize,
          config.width,
          config.height,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          activeLayer,
          activeFrame,
        );
        break;

      default:
        drawPixel(
          x,
          y,
          pixelSize,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          activeLayer,
          activeFrame,
        );
        break;
    }

    setArtworkObject(newArtworkObject);
  };

  const getToolIcon = () => {
    const toolProps = {
      size: 26,
      className: `stroke-[1.35px] ${
        hexToHsl(currentColour.colour as string).l >= 50
          ? "text-neutral-800"
          : "text-neutral-100"
      }`,
      style: {
        fill: currentColour.colour as string,
        transform: "translate(-15%, -270%)",
      },
    };

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
              transform: "translate(-15%, -270%)",
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
                transform: "translate(-15%, -270%)",
              }}
            />
          </div>
        );
      case "Eraser":
        return (
          <IconEraser
            size={26}
            className={`stroke-[1.35px] text-neutral-900`}
            style={{
              fill: "white",
              transform: "translate(-40%, -270%)",
            }}
          />
        );
      case "Fill":
        return (
          <div className={`relative flex flex-col items-center`}>
            <div
              className={`absolute -top-full left-0 w-2 h-2 border-neutral-900`}
              style={{
                backgroundColor: currentColour.colour as string,
                clipPath: "polygon(0 0, 100% 100%, 100% 0%)",
                transform: "translate(0%, -400%) rotateZ(180deg)",
              }}
            ></div>
            <IconPaint
              size={26}
              className={`stroke-[1.15px] ${
                hexToHsl(currentColour.colour as string).l > 50
                  ? "text-neutral-900"
                  : "text-neutral-100"
              } `}
              style={{
                fill: currentColour.colour as string,
                transform: "translate(0%, -300%)",
              }}
            />
          </div>
        );
      default:
        return <IconPencil {...toolProps} />;
    }
  };

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent,
  ) => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event instanceof MouseEvent) {
      return {
        x: Math.floor((event.clientX - rect.left) * scaleX),
        y: Math.floor((event.clientY - rect.top) * scaleY),
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

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    event.preventDefault();

    if (event.button === 0) {
      const getCurrentArtwork =
        artworkObject.layers[activeLayer].frames[activeFrame];

      const currentArtwork = imageDataToJSON(
        getCurrentArtwork === null ? new ImageData(1, 1) : getCurrentArtwork,
      );

      sessionStorage.setItem("historyArtwork", JSON.stringify(currentArtwork));

      setIsDrawing(true);
      activateTool(x, y);

      // Update Preview Window
      const previewContext = previewCanvasRef.current!.getContext("2d", {
        willReadFrequently: true,
      });

      updatePreviewWindow(
        backgroundRef.current!,
        previewContext!,
        layerRefs.current,
      );
    }
  };

  const finishDrawing = () => {
    if (isDrawing) {
      const getFromSession = sessionStorage.getItem("historyArtwork");
      const previousArtwork = jsonToImageData(JSON.parse(getFromSession!));

      const changed = hasImageDataChanged(
        previousArtwork,
        artworkObject.layers[activeLayer].frames[activeFrame] as ImageData,
      );

      console.log(changed);
      if (changed) {
        saveToHistory(artworkObject);
      }

      setIsDrawing(false);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    setZoomCenter({ x: event.clientX, y: event.clientY });
    setCanvasZoom((prevScale) =>
      Math.max(0.1, prevScale - event.deltaY * 0.001),
    );
  };

  const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    if (isDrawing) {
      activateTool(x, y);

      // Update Preview Window
      const previewContext = previewCanvasRef.current!.getContext("2d", {
        willReadFrequently: true,
      });

      updatePreviewWindow(
        backgroundRef.current!,
        previewContext!,
        layerRefs.current,
      );
    }
  };

  const touchDraw = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event.nativeEvent);
    if (isDrawing) activateTool(x, y);

    // Update Preview Window
    const previewContext = previewCanvasRef.current!.getContext("2d", {
      willReadFrequently: true,
    });

    updatePreviewWindow(
      backgroundRef.current!,
      previewContext!,
      layerRefs.current,
    );
  };

  // History Undo
  const handleUndo = () => {
    let historyPointer = parseInt(
      sessionStorage.getItem("historyPointer") || "0",
    );

    if (historyPointer > 0) {
      historyPointer--;

      let historyData: ArtworkObject[] =
        loadArtworkHistoryFromSession("history");

      sessionStorage.setItem("historyPointer", historyPointer.toString());

      const previousArtworkObject = historyData[historyPointer];
      setArtworkObject(previousArtworkObject);
      canvasUpdate(previousArtworkObject);
    }
  };

  const handleRedo = () => {
    let historyPointer = parseInt(
      sessionStorage.getItem("historyPointer") || "0",
    );

    let historyData: ArtworkObject[] = loadArtworkHistoryFromSession("history");

    if (historyPointer < historyData.length - 1) {
      historyPointer++;

      sessionStorage.setItem("historyPointer", historyPointer.toString());

      const nextArtworkObject = historyData[historyPointer];
      setArtworkObject(nextArtworkObject);
      canvasUpdate(nextArtworkObject);
    }
  };

  // Undo/Redo Event Listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        handleUndo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const canvasUpdate = (newArtwork: ArtworkObject) => {
    const canvas = layerRefs.current[activeLayer].current!;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) return;

    layerRefs.current.forEach((layer, index) => {
      const layerCanvas = layer.current!;
      const layerContext = layerCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!layerContext) return;

      const frameData = newArtwork.layers[index].frames[activeFrame];
      if (frameData) {
        layerContext.putImageData(frameData, 0, 0);
      } else {
        layerContext.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
      }
    });

    const previewContext = previewCanvasRef.current!.getContext("2d", {
      willReadFrequently: true,
    });

    updatePreviewWindow(
      backgroundRef.current!,
      previewContext!,
      layerRefs.current,
    );
  };

  // Use-Gesture for Touch Gestures
  useGesture({
    onPinch: ({ offset: [d] }) => {
      setCanvasZoom((prevScale) => Math.max(0.1, prevScale * d));
    },
    onDrag: ({ active, event }) => {
      if (active && event instanceof TouchEvent) {
        const currentLayer = layerRefs.current[activeLayer].current!;
        const { x, y } = getMousePosition(currentLayer, event);
        if (isDrawing) activateTool(x, y);
      }
    },
    onDoubleClick: ({ event }) => {
      event.preventDefault();
      handleResize();
    },
  });

  // RESIZE
  const handleResize = () => {
    setCanvasZoom(1);

    const wrapper: HTMLDivElement = wrapperRef.current!;
    if (!wrapper) return;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const wrapperRatio = wrapperWidth / wrapperHeight;
    const artworkRatio = config.width / config.height;

    let scaledPixel = 0;
    let prelimCanvasWidth = 0;
    let prelimCanvasHeight = 0;

    if (wrapperRatio <= artworkRatio) {
      prelimCanvasWidth = Math.floor(wrapperWidth);
      scaledPixel = Math.floor(prelimCanvasWidth / config.width);
    } else {
      prelimCanvasHeight = Math.floor(wrapperHeight);
      scaledPixel = Math.floor(prelimCanvasHeight / config.height);
    }

    layerRefs.current.forEach((layer, index) => {
      const canvas: HTMLCanvasElement = layer.current!;
      if (!canvas) return;

      canvas.width = config.width;
      canvas.height = config.height;
      canvas.style.width = `${scaledPixel * config.width}px`;
      canvas.style.height = `${scaledPixel * config.height}px`;

      // Redraw Image
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (context) {
        context.imageSmoothingEnabled = false;

        const layer = artworkObject.layers[index];
        const frameData = layer.frames[activeFrame];

        if (frameData) {
          context.putImageData(frameData, 0, 0);
        }
      }
    });

    if (config.background === "transparent") {
      const transparentBackground: HTMLCanvasElement =
        transparentBackgroundRef.current!;
      transparentBackground.width = config.width;
      transparentBackground.height = config.height;
      transparentBackground.style.width = `${scaledPixel * config.width}px`;
      transparentBackground.style.height = `${scaledPixel * config.height}px`;

      drawTransparentGrid(transparentBackground, config.width, config.height);
    }

    const backgroundCanvas: HTMLCanvasElement = backgroundRef.current!;
    backgroundCanvas.width = config.width;
    backgroundCanvas.height = config.height;
    backgroundCanvas.style.width = `${scaledPixel * config.width}px`;
    backgroundCanvas.style.height = `${scaledPixel * config.height}px`;

    fillCanvas(backgroundCanvas, config.background as string);

    // Set Pixel Size - default to square for now
    setPixelSize({ x: 1, y: 1 });

    setLoading(false);
  };

  useEffect(() => {
    const savedArtwork = loadArtworkFromSession("artworkObject");

    if (savedArtwork) {
      setArtworkObject(savedArtwork);
    }

    const canvas = layerRefs.current[activeLayer].current!;

    if (!canvas) return;
    handleResize();
  }, []);

  const handleNewLayer = () => setArtworkObject(addNewLayer(artworkObject));
  const handleNewFrame = () => setArtworkObject(addNewFrame(artworkObject));
  const handleDeleteLayer = () =>
    setArtworkObject(deleteLayer(artworkObject, activeLayer));
  const handleDeleteFrame = () =>
    setArtworkObject(deleteFrame(artworkObject, activeFrame));
  const handleMoveLayerUp = () =>
    setArtworkObject(moveLayerUp(artworkObject, activeLayer));
  const handleMoveLayerDown = () =>
    setArtworkObject(moveLayerDown(artworkObject, activeLayer));

  return (
    <section className={`flex-grow flex flex-col h-full ${className}`}>
      <article className={`relative flex-grow py-10`}>
        <div
          ref={wrapperRef}
          className={`mx-auto w-full h-full z-10`}
          style={{
            transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`,
            transform: ` scale(${canvasZoom})`,
          }}
        >
          <section
            className={`mx-auto relative top-1/2 -translate-y-1/2 w-fit h-fit border-2 border-neutral-900 ${
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
            onTouchCancel={finishDrawing}
            onTouchMove={touchDraw}
          >
            {/* Transparent Grid */}
            {config.background === "transparent" && (
              <canvas
                ref={transparentBackgroundRef}
                className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full z-0`}
                style={{
                  aspectRatio: config.width / config.height,
                  imageRendering: "pixelated",
                }}
              ></canvas>
            )}

            {/* Background Canvas */}
            <canvas
              ref={backgroundRef}
              className={`pointer-events-none absolute top-0 left-0 flex flex-col w-full h-full bg-${config?.background} z-0`}
              style={{
                aspectRatio: config.width / config.height,
                imageRendering: "pixelated",
              }}
            ></canvas>

            {layerRefs.current.map((layerRef, index) => (
              <CanvasLayer
                key={`drawing-layer-${index}`}
                ref={layerRef}
                config={config}
                frame={artworkObject.layers[index].frames[activeFrame]}
              />
            ))}
          </section>
        </div>

        {/* Preview Window */}
        <canvas
          ref={previewCanvasRef}
          className={`absolute bottom-4 right-4 w-16 border-2 border-neutral-900`}
          style={{
            aspectRatio: config?.width / config?.height,
            imageRendering: "pixelated",
          }}
          width={config?.width}
          height={config?.height}
        ></canvas>
      </article>

      <article
        className={`p-5 w-full min-h-[220px] max-h-[250px] bg-white dark:bg-neutral-900 z-20`}
      >
        <section className={`flex flex-col items-start`}>
          <article
            className={`relative inline-flex border-2 border-transparent`}
          >
            <span
              className={`px-3 flex items-center gap-2 w-[200px] h-7 border-r-2 border-transparent text-sm`}
            ></span>
            {artworkObject.frames.map((frame, index) => (
              <div
                key={`frame-label-${index}`}
                className={`flex items-center justify-center border-r-2 border-transparent w-8 h-7 font-sans text-center ${
                  index === activeFrame - 1 ? "font-bold" : ""
                }`}
                style={{ aspectRatio: 1 }}
              >
                {index + 1}
              </div>
            ))}
            <div
              className={`flex items-center justify-center border-r-2 border-transparent w-8 h-7 font-sans text-center`}
              style={{ aspectRatio: 1 }}
            >
              <IconSquareRoundedPlusFilled
                size={24}
                className={` hover:text-primary-600 transition-all duration-300`}
                onClick={handleNewFrame}
              />
            </div>
          </article>

          {artworkObject.layers.map((layer, index) => (
            <article
              key={`layer-indicator-${index}`}
              className={`relative inline-flex border-2 border-neutral-900 rounded-full overflow-hidden`}
            >
              <span
                className={`px-3 flex items-center justify-between w-[200px] h-7 border-r-2 border-neutral-900 text-sm ${
                  index === activeLayer ? "font-bold" : ""
                }`}
              >
                {layer.name}
                <IconPencil size={20} />
              </span>
              {Object.keys(layer.frames).map((frame, index) => (
                <div
                  key={`frame-indicator-${index}`}
                  className={`cursor-pointer grid place-content-center [&:not(:last-of-type)]:border-r-2 border-neutral-900 w-8 h-7`}
                  style={{ aspectRatio: 1 }}
                  onClick={() => setActiveFrame(parseInt(frame))}
                >
                  {layer.frames[parseInt(frame)] != null ? (
                    <div
                      className={`w-4 h-4 rounded-full bg-neutral-900`}
                    ></div>
                  ) : null}
                </div>
              ))}
            </article>
          ))}
        </section>

        <section className={`flex gap-2 `}></section>
      </article>

      <div
        ref={cursorRef}
        className={`pointer-events-none absolute ${
          mouseInCanvas ? "block" : "hidden"
        } z-50`}
      >
        {getToolIcon()}
      </div>
    </section>
  );
};

export default CanvasContainer;
