"use client";

import React, {
  useRef,
  useState,
  useEffect,
  createRef,
  RefObject,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  ArtTool,
  Artwork,
  ArtworkObject,
  CanvasConfig,
  ColourObject,
} from "@/types/canvas";
import { NewArtworkObject } from "@/data/ArtworkObject";

import { IconEraser, IconPencil } from "@tabler/icons-react";
import { PaintBucket, Pipette } from "lucide-react";

import {
  drawAtPixel,
  drawTransparentGrid,
  eraseAtPixel,
  fillCanvas,
  fillAtPixel,
  pickerAtPixel,
  updatePreviewWindow,
} from "@/utilities/ArtToolsUtils";

import {
  addNewFrame,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  deleteFrame,
  hasImageDataChanged,
  validateFrames,
  validateSingleLayer,
} from "@/utilities/LayerUtils";

import CanvasLayer from "@/components/CanvasLayer";
import { hexToHsl } from "@/utilities/ColourUtils";
import { throttle } from "@/utilities/ThrottleUtils";
import { redo, undo } from "@/utilities/HistoryManagement";
import { getArtwork, saveHistory } from "@/utilities/IndexedUtils";
import LayerControls from "@/components/LayerControls";

interface CanvasEditorProps {
  className?: string;
  setColour?: (colour: string, alpha: number) => void;
  currentColour?: ColourObject;
  currentTool?: ArtTool;
  toggleTools?: () => void;
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
  toggleTools = () => {},
  config = { width: 32, height: 16, background: "transparent" },
}: CanvasEditorProps) => {
  const searchParams = useSearchParams();

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
  const drawingTimeout = useRef<number>(0);
  const evCache = useRef<number[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Layer-Related Refs
  const layerRefs = useRef<RefObject<HTMLCanvasElement>[]>([]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const transparentBackgroundRef = useRef<HTMLCanvasElement>(null);

  const activateTool = async (x: number, y: number) => {
    const currentLayer = layerRefs.current[activeLayer].current;
    const currentContext = currentLayer?.getContext("2d");

    if (!currentLayer || !currentContext || evCache.current.length !== 1)
      return;
    const newArtworkObject: ArtworkObject = { ...artworkObject };

    switch (currentTool.name) {
      case "Pencil":
        await drawAtPixel(
          x,
          y,
          pixelSize,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          config?.keyIdentifier!,
          activeLayer,
          activeFrame,
        );
        break;

      case "Picker":
        const { colour, alpha } = pickerAtPixel(
          x,
          y,
          pixelSize,
          currentContext,
        );

        setColour(colour, alpha);
        toggleTools();
        break;

      case "Eraser":
        await eraseAtPixel(
          x,
          y,
          pixelSize,
          currentLayer,
          currentContext,
          newArtworkObject,
          config?.keyIdentifier!,
          activeLayer,
          activeFrame,
        );
        break;

      case "Fill":
        await fillAtPixel(
          x,
          y,
          pixelSize,
          config.width,
          config.height,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          config?.keyIdentifier!,
          activeLayer,
          activeFrame,
        );
        break;

      default:
        await drawAtPixel(
          x,
          y,
          pixelSize,
          currentColour,
          currentLayer,
          currentContext,
          newArtworkObject,
          config?.keyIdentifier!,
          activeLayer,
          activeFrame,
        );
        break;
    }

    setArtworkObject(newArtworkObject);
  };

  const getMousePosition = (
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.floor((event.clientX - rect.left) * scaleX),
      y: Math.floor((event.clientY - rect.top) * scaleY),
    };
  };

  const throttledDraw = useCallback(
    throttle(async (event: React.PointerEvent<HTMLCanvasElement>) => {
      const currentLayer = layerRefs.current[activeLayer].current!;

      // Validate Layer
      const { x, y } = getMousePosition(currentLayer, event);
      if (isDrawing && evCache.current.length === 1) {
        await activateTool(x, y);

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
    }, 100),
    [
      isDrawing,
      activeLayer,
      activeFrame,
      pixelSize,
      currentColour,
      artworkObject,
      config,
    ],
  );

  const draw = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    await throttledDraw(event);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    setZoomCenter({ x: event.clientX, y: event.clientY });
    setCanvasZoom((prevScale) =>
      Math.max(0.1, prevScale - event.deltaY * 0.001),
    );
  };

  const startDrawing = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    const currentLayer = layerRefs.current[activeLayer].current!;

    const { x, y } = getMousePosition(currentLayer, event);
    event.preventDefault();

    if (evCache.current.length === 1) {
      setIsDrawing(true);
      await saveHistory(artworkObject);
      await activateTool(x, y);

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

  const finishDrawing = async () => {
    if (isDrawing) {
      try {
        const getFromDB = async () => {
          const artwork: Artwork = (await getArtwork(
            config?.keyIdentifier!,
          )) as Artwork;

          return artwork.layers[activeLayer].frames[activeFrame];
        };

        const previousArtwork = await getFromDB();

        if (previousArtwork) {
          const changed = hasImageDataChanged(
            previousArtwork,
            artworkObject.layers[activeLayer].frames[activeFrame] as ImageData,
          );

          if (changed) {
            await saveHistory(artworkObject);
          }
        }
      } catch (error) {
        console.log(`Error finishing drawing: ${error}`);
      } finally {
        setIsDrawing(false);
      }
    } else {
      setIsDrawing(false);
    }
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
            <PaintBucket
              size={26}
              className={`stroke-[1.15px] ${
                hexToHsl(currentColour.colour as string).l > 50
                  ? "text-neutral-900"
                  : "text-neutral-100"
              } `}
              style={{
                fill: currentColour.colour as string,
                transform: "translate(-10%, -80%) scaleX(-1)",
              }}
            />
          </div>
        );
      default:
        return <IconPencil {...toolProps} />;
    }
  };

  // History Undo
  const handleUndo = async () => {
    const previousState = await undo();
    if (previousState) {
      setArtworkObject(previousState);
      canvasUpdate(previousState);
    }
  };

  const handleRedo = async () => {
    const nextState = await redo();
    if (nextState) {
      setArtworkObject(nextState);
      canvasUpdate(nextState);
    }
  };

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

  // Undo/Redo Event Listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        handleUndo().then(() => console.log("Undo Complete"));
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "y") {
        event.preventDefault();
        handleRedo().then(() => console.log("Redo Complete"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      layerRefs.current.forEach((layer) => {
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
    if (layerRefs.current.length < layerCount) {
      for (let i = layerRefs.current.length; i < layerCount; i++) {
        const newLayer = createRef<HTMLCanvasElement>();
        layerRefs.current.push(newLayer);
      }
    } else if (layerRefs.current.length > layerCount) {
      layerRefs.current.length = layerCount;
    }

    requestAnimationFrame(() => {
      layerRefs.current.forEach((layer, index) => {
        if (!layer.current) return;

        let canvas: HTMLCanvasElement = layer.current!;

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
    let savedArtwork = NewArtworkObject;

    const loadArtwork = async () => {
      try {
        savedArtwork = (await getArtwork(config?.keyIdentifier!)) as Artwork;
        setArtworkObject(savedArtwork!);

        const layerCount = savedArtwork!.layers.length || 1;

        requestAnimationFrame(() => {
          validateLayerRefs(layerCount, scaledPixel, savedArtwork!);
          validateLayers();
          validateFrames(savedArtwork!);
        });
      } catch (error) {
        console.log(`Error loading artwork: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    handleResize();
    loadArtwork();
  }, [searchParams]);

  useEffect(() => {
    const previewContext = previewCanvasRef.current!.getContext("2d", {
      willReadFrequently: true,
    });

    updatePreviewWindow(
      backgroundRef.current!,
      previewContext!,
      layerRefs.current,
    );
  }, [artworkObject, layerRefs]);

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

    if (config.background !== "transparent") {
      const backgroundCanvas: HTMLCanvasElement = backgroundRef.current!;
      backgroundCanvas.width = config.width;
      backgroundCanvas.height = config.height;
      backgroundCanvas.style.width = `${scaledPixel * config.width}px`;
      backgroundCanvas.style.height = `${scaledPixel * config.height}px`;

      fillCanvas(backgroundCanvas, config.background as string);
    }

    // Set Pixel Size - default to square for now
    setPixelSize({ x: 1, y: 1 });
  };

  const handleNewLayer = () => {
    const newLayer = createRef<HTMLCanvasElement>();
    layerRefs.current.push(newLayer);
  };

  const handleNewFrame = async () => {
    const updatedArtwork = await addNewFrame(
      artworkObject,
      config?.keyIdentifier!,
    );
    setArtworkObject(updatedArtwork);
    setActiveFrame(updatedArtwork.frames.length);
  };
  const handleDeleteLayer = async () =>
    setArtworkObject(
      await deleteLayer(artworkObject, config?.keyIdentifier!, activeLayer),
    );
  const handleDeleteFrame = async () =>
    setArtworkObject(
      await deleteFrame(artworkObject, config?.keyIdentifier!, activeFrame),
    );
  const handleMoveLayerUp = async () =>
    setArtworkObject(
      await moveLayerUp(artworkObject, config?.keyIdentifier!, activeLayer),
    );
  const handleMoveLayerDown = async () =>
    setArtworkObject(
      await moveLayerDown(artworkObject, config?.keyIdentifier!, activeLayer),
    );

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
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(3px)",
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
        onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
          if (event.pointerType === "mouse" && event.button === 1) {
            const now = Date.now();

            if (now - lastClick < 500) {
              handleResize();
            } else setLastClick(now);
          } else if (event.button === 2) {
            toggleTools();
          }
        }}
      >
        {/* Artwork Wrapper */}
        <section
          ref={wrapperRef}
          className={`cursor-none touch-none mx-auto relative ${
            loading ? "opacity-0" : "opacity-100"
          } shadow-xl shadow-neutral-900 transition-all duration-300`}
          style={{ aspectRatio: config.width / config.height }}
          onContextMenu={(event) => event.preventDefault()}
          onPointerOver={() =>
            evCache.current.length < 2 && setMouseInCanvas(true)
          }
          onPointerDown={(event: React.PointerEvent<HTMLCanvasElement>) => {
            evCache.current.push(event.pointerId);

            if (event.pointerType === "mouse" && event.button === 2) return;
            if (artworkObject.layers[activeLayer].locked) return;

            if (evCache.current.length === 1) {
              drawingTimeout.current = window.setTimeout(async () => {
                if (evCache.current.length === 1) {
                  if (currentTool.trigger === "down") {
                    await startDrawing(event);
                  }
                }
              }, 20);
            }
          }}
          onPointerUp={async (event: React.PointerEvent<HTMLCanvasElement>) => {
            if (artworkObject.layers[activeLayer].locked) return;

            if (event.button === 0 && currentTool.trigger === "up") {
              await startDrawing(event);
            }

            evCache.current = evCache.current.filter(
              (pointer) => pointer !== event.pointerId,
            );
            await finishDrawing();
          }}
          onPointerLeave={async (event: React.PointerEvent) => {
            evCache.current = evCache.current.filter(
              (pointer) => pointer !== event.pointerId,
            );

            await finishDrawing();
            setMouseInCanvas(false);
          }}
          onPointerMove={async (
            event: React.PointerEvent<HTMLCanvasElement>,
          ) => {
            let { clientX, clientY } = event;

            if (cursorRef.current) {
              cursorRef.current!.style.left = clientX + "px";
              cursorRef.current!.style.top = clientY + "px";
            }

            for (let i = 0; i < evCache.current.length; i++) {
              if (evCache.current[i] === event.pointerId) {
                evCache.current[i] = event.pointerId;
                break;
              }
            }

            // only draw when there's only one pointer
            // only draw with touch if there's no mouse nearby
            if (
              evCache.current.length === 1 &&
              !artworkObject.layers[activeLayer].locked
            ) {
              await draw(event);
            }
          }}
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
            const thisLayer = artworkObject.layers[index].visible;

            return (
              <CanvasLayer
                key={`drawing-layer-${index}`}
                ref={layerRef}
                config={config}
                frame={artworkObject.layers[index].frames[activeFrame]}
                className={thisLayer ? "block" : "hidden"}
              />
            );
          })}
        </section>
      </article>

      {/* Layer/Frame Controls */}
      <LayerControls
        artworkObject={artworkObject}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        activeFrame={activeFrame}
        setActiveFrame={setActiveFrame}
        handleNewLayer={handleNewLayer}
        handleNewFrame={handleNewFrame}
      />
    </section>
  );
};

export default CanvasContainer;
