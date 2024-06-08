"use client";

import React, {
  useRef,
  useState,
  useEffect,
  createRef,
  RefObject,
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
  IconLayersSubtract,
  IconMovie,
  IconNewSection,
  IconPaint,
  IconPencil,
} from "@tabler/icons-react";

import {
  drawPixel,
  drawTransparentGrid,
  erasePixel,
  fillCanvas,
  fillPixel,
  isImageDataEmpty,
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
  howManyFrames,
  validateFrames,
  validateSingleLayer,
} from "@/utilities/LayerUtils";
import { PaintBucket, Pipette } from "lucide-react";

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
  const windowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Layer-Related Refs
  const layerRefs = useRef<RefObject<HTMLCanvasElement>[]>([]);

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
        transform: "translate(-15%, -80%)",
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
            <Pipette
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
            className={`stroke-[1.35px] text-neutral-900`}
            style={{
              fill: "white",
              transform: "translate(-40%, -80%)",
            }}
          />
        );
      case "Fill":
        return (
          <div className={`relative flex flex-col items-center`}>
            {/*<div*/}
            {/*  className={`absolute -top-1/2 left-0 w-2 h-2 border-neutral-900`}*/}
            {/*  style={{*/}
            {/*    backgroundColor: currentColour.colour as string,*/}
            {/*    clipPath: "polygon(0 0, 100% 100%, 100% 0%)",*/}
            {/*    transform: "translate(0%, 100%) rotateZ(180deg)",*/}
            {/*  }}*/}
            {/*></div>*/}
            <PaintBucket
              size={26}
              className={`stroke-[1.15px] ${
                hexToHsl(currentColour.colour as string).l > 50
                  ? "text-neutral-900"
                  : "text-neutral-100"
              } `}
              style={{
                fill: currentColour.colour as string,
                transform: "translate(-80%, -80%)",
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
      // const getFromSession = sessionStorage.getItem("historyArtwork");
      // const previousArtwork = jsonToImageData(JSON.parse(getFromSession!));
      //
      // const changed = hasImageDataChanged(
      //   previousArtwork,
      //   artworkObject.layers[activeLayer].frames[activeFrame] as ImageData,
      // );
      //
      // if (changed) {
      //   saveToHistory(artworkObject);
      // }

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

    // Validate Layer

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

    const scaledPixel = getScaledPixel(config);
    if (!scaledPixel) return;

    const wrapper: HTMLDivElement = wrapperRef.current!;
    if (!wrapper) return;

    wrapper.style.width = `${scaledPixel * config.width}px`;
    wrapper.style.height = `${scaledPixel * config.height}px`;

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

  const getScaledPixel = (config: CanvasConfig): undefined | number => {
    const artworkWindow: HTMLDivElement = windowRef.current!;
    if (!artworkWindow) return;

    const windowWidth = artworkWindow.clientWidth;
    const windowHeight = artworkWindow.clientHeight;

    const windowRatio = windowWidth / windowHeight;
    const artworkRatio = config.width / config.height;

    let prelimCanvasWidth = 0;
    let prelimCanvasHeight = 0;

    if (windowRatio <= artworkRatio) {
      prelimCanvasWidth = Math.floor(windowWidth);
      return Math.floor(prelimCanvasWidth / config.width);
    } else {
      prelimCanvasHeight = Math.floor(windowHeight);
      return Math.floor(prelimCanvasHeight / config.height);
    }
  };

  const validateLayers = (layerIndex?: number) => {
    const scaledPixel = getScaledPixel(config);
    if (!scaledPixel) return;

    if (layerIndex === undefined) {
      layerRefs.current.forEach((layer, index) => {
        validateSingleLayer(layer.current!, config, scaledPixel);
      });
    } else {
      validateSingleLayer(
        layerRefs.current[layerIndex].current!,
        config,
        scaledPixel,
      );
    }

    return true;
  };

  const validateLayerRefs = (
    layerCount: number,
    scaledPixel: number,
    artwork: ArtworkObject = artworkObject,
  ) => {
    if (layerRefs.current.length !== layerCount) {
      for (let i = 0; i < layerCount; i++) {
        const newLayer = createRef<HTMLCanvasElement>();
        layerRefs.current.push(newLayer);
      }
    }

    requestAnimationFrame(() => {
      layerRefs.current.forEach((layer, index) => {
        let canvas: HTMLCanvasElement = layer.current!;
        if (!canvas) return;

        canvas.width = config.width;
        canvas.height = config.height;
        canvas.style.width = `${scaledPixel * config.width}px`;
        canvas.style.height = `${scaledPixel * config.height}px`;

        // Redraw Image
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (context) {
          context.imageSmoothingEnabled = false;

          const layer = artwork.layers[index];
          const frameData = layer.frames[activeFrame];

          if (frameData) {
            context.putImageData(frameData, 0, 0);
          }
        }
      });
    });
  };

  // On Load
  useEffect(() => {
    const scaledPixel = getScaledPixel(config) || 10;
    const savedArtwork =
      loadArtworkFromSession("artworkObject") || NewArtworkObject;

    setArtworkObject(savedArtwork);

    const layerCount = savedArtwork.layers.length || 1;

    requestAnimationFrame(() => {
      validateLayerRefs(layerCount, scaledPixel, savedArtwork);
      validateLayers();
      validateFrames(savedArtwork);
    });

    handleResize();
  }, []);

  const handleNewLayer = () => {
    const newLayer = createRef<HTMLCanvasElement>();
    layerRefs.current.push(newLayer);
  };

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
    <section className={`relative flex-grow flex flex-col h-full ${className}`}>
      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed ${
          mouseInCanvas ? "block" : "hidden"
        } z-50`}
      >
        {getToolIcon()}
      </div>

      {/* Preview Window */}
      <canvas
        ref={previewCanvasRef}
        className={`absolute top-4 right-4 w-24 border-2 border-neutral-900 z-50`}
        style={{
          aspectRatio: config?.width / config?.height,
          imageRendering: "pixelated",
        }}
        width={config?.width}
        height={config?.height}
      ></canvas>

      {/* Artwork Window */}
      <article
        ref={windowRef}
        className={`flex-grow relative grid place-content-center w-full h-full z-10`}
        style={{
          transformOrigin: `${zoomCenter.x}px ${zoomCenter.y}px`,
          transform: ` scale(${canvasZoom})`,
        }}
        onWheel={handleWheel}
        onMouseUp={(event: React.MouseEvent<HTMLDivElement>) => {
          if (event.button === 1) {
            const now = Date.now();

            if (now - lastClick < 500) {
              handleResize();
            } else setLastClick(now);
          }
        }}
      >
        {/* Artwork Wrapper */}
        <section
          ref={wrapperRef}
          className={`mx-auto relative ${
            loading ? "opacity-0" : "opacity-100"
          } shadow-xl shadow-neutral-900 transition-all duration-300`}
          style={{ aspectRatio: config.width / config.height }}
          onMouseEnter={() => setMouseInCanvas(true)}
          onMouseDown={(event: React.MouseEvent<HTMLCanvasElement>) => {
            if (currentTool.trigger === "down") startDrawing(event);
          }}
          onMouseUp={(event: React.MouseEvent<HTMLCanvasElement>) => {
            if (event.button === 0) {
              if (currentTool.trigger === "up") startDrawing(event);
            }

            finishDrawing();
          }}
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

          {layerRefs.current.map((layerRef, index) => {
            return (
              <CanvasLayer
                key={`drawing-layer-${index}`}
                ref={layerRef}
                config={config}
                frame={artworkObject.layers[index].frames[activeFrame]}
              />
            );
          })}
        </section>
      </article>

      {/* Layer/Frame Controls */}
      <article className={`absolute bottom-0 left-0 right-0 z-50`}>
        <section
          className={`px-3 py-2 flex flex-col justify-start items-stretch h-full bg-neutral-100 rounded-3xl`}
        >
          {/* Header */}
          <article
            className={`pb-2 flex flex-row border-b border-secondary-500`}
          >
            <div
              className={`py-2 mr-2 flex items-start justify-center w-8 h-8 text-secondary-500 transition-all duration-300`}
            >
              <IconMovie size={24} />
            </div>

            {artworkObject.frames.map((frame, index) => (
              <div
                key={`frame-label-${index}`}
                className={`cursor-pointer flex items-center justify-center w-8 hover:bg-primary-500 aspect-square border-r border-neutral-300 font-sans text-center ${
                  index === activeFrame - 1
                    ? "text-primary-500 font-bold"
                    : "text-neutral-900"
                } hover:text-neutral-100 transition-all duration-300`}
                onClick={() => setActiveFrame(index + 1)}
              >
                {index + 1}
              </div>
            ))}
            <div
              className={`px-2 cursor-pointer flex flex-row items-center justify-center gap-1 hover:bg-primary-500 h-8 font-sans text-center text-secondary-500 hover:text-neutral-100 transition-all duration-300`}
              onClick={handleNewFrame}
            >
              <IconNewSection size={24} />
              <span className={`text-sm font-medium`}>New Frame</span>
            </div>
          </article>

          {/* Layer Table */}
          <article className={`flex flex-row border-b border-secondary-500`}>
            <div
              className={`pt-2 mr-2 flex items-start justify-center w-8 text-secondary-500 transition-all duration-300`}
            >
              <IconLayersSubtract size={24} />
            </div>

            <div className={`flex flex-col w-full`}>
              {artworkObject.layers.map((layer, lIndex) => (
                <div
                  key={`layer-indicator-${lIndex}`}
                  className={`py-1 relative flex flex-col [&:not(:last-of-type)]:border-b [&:not(:last-of-type)]:border-secondary-300/50 ${
                    lIndex === activeLayer ? "" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-start gap-2.5 w-[200px] h-7 text-sm text-secondary-500 ${
                      lIndex === activeLayer ? "" : ""
                    }`}
                  >
                    <button className={`grid place-content-center w-8`}>
                      <IconPencil size={20} />
                    </button>
                    <span
                      className={`cursor-pointer text-sm ${
                        lIndex === activeLayer
                          ? " text-primary-500 font-bold"
                          : "hover:text-primary-500"
                      } transition-all duration-300`}
                      onClick={() => setActiveLayer(lIndex)}
                    >
                      {layer.name}
                    </span>
                  </div>

                  <article className={`flex flex-row`}>
                    {Object.keys(layer.frames).map((frame, fIndex) => (
                      <div
                        key={`frame-indicator-${fIndex}`}
                        className={`my-1 flex items-center justify-center border-r border-neutral-300 w-8 font-sans text-center text-secondary-500 ${
                          fIndex === activeFrame - 1 ? "font-bold" : ""
                        }`}
                        style={{ aspectRatio: 1 }}
                        onClick={() => {
                          setActiveFrame(fIndex + 1);
                          setActiveLayer(lIndex);
                        }}
                      >
                        <div
                          className={`w-4 h-4 rounded-full ${
                            layer.frames[fIndex + 1] === null ||
                            isImageDataEmpty(layer.frames[fIndex + 1]!)
                              ? fIndex + 1 === activeFrame &&
                                lIndex === activeLayer
                                ? "bg-transparent border-primary-500"
                                : "bg-transparent border-neutral-900"
                              : fIndex + 1 === activeFrame &&
                                  lIndex === activeLayer
                                ? "bg-primary-500 border-primary-500"
                                : "bg-neutral-900 border-neutral-900"
                          } border`}
                        ></div>
                      </div>
                    ))}
                  </article>
                </div>
              ))}
            </div>
          </article>

          <div
            className={`px-2 cursor-pointer inline-flex flex-row items-center justify-start gap-1 hover:bg-primary-500 w-fit h-8 font-sans text-center text-secondary-500 hover:text-neutral-100 transition-all duration-300`}
            onClick={() => {
              handleNewLayer();

              setArtworkObject(addNewLayer(artworkObject));
              setActiveLayer(layerRefs.current.length - 1);

              requestAnimationFrame(() => {
                validateLayers(layerRefs.current.length - 1);
              });
            }}
          >
            <IconNewSection size={24} className={``} />
            <span className={`text-sm font-medium`}>New Layer</span>
          </div>
        </section>

        <section className={`flex gap-2 `}></section>
      </article>
    </section>
  );
};

export default CanvasContainer;
