"use client";

import React, {
  useRef,
  useState,
  useEffect,
  createRef,
  RefObject,
} from "react";

import useArtStore from "@/utils/Zustand";
import { currentMousePosition } from "@/utils/Mouse";
import { activateDrawingTool } from "@/utils/Drawing";
import { colourBackground } from "@/utils/CanvasLayers";

import { Artwork } from "@/types/canvas";
import CanvasLayer from "@/components/CanvasLayer";
import { DRAWING_TOOLS } from "@/data/DefaultTools";
import { IconCrosshair, IconHandGrab } from "@tabler/icons-react";
import { saveArtwork } from "@/utils/IndexedDB";
import { PuffLoader } from "react-spinners";

const LiveDrawingArea = ({
  liveArtwork,
  setLiveArtwork,
}: {
  liveArtwork: Artwork;
  setLiveArtwork: React.Dispatch<React.SetStateAction<Artwork>>;
}) => {
  // Hooks
  // States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [startMoving, setStartMoving] = useState<boolean>(false);
  const [startDrawing, setStartDrawing] = useState<boolean>(false);

  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [saveInterval, setSaveInterval] = useState<number>(10 * 1000);

  const [pixelReference, setPixelReference] = useState<number>(1);
  const [dominantDimension, setDominantDimension] = useState<string>("width");

  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [doubleClickTime, setDoubleClickTime] = useState<number>(0);
  const [mouseInCanvas, setMouseInCanvas] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [pointerPrevDiff, setPointerPrevDiff] = useState<number>(-1);

  const [canvasPosition, setCanvasPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const [MouseButtons] = useState({
    LeftClick: 0,
    MiddleClick: 1,
    RightClick: 2,
  });

  const [Touches] = useState({
    OneFinger: 1,
    TwoFingers: 2,
    ThreeFingers: 3,
    FourFingers: 4,
  });

  // Zustands
  const {
    isSaving,
    setIsSaving,
    canvasSize,
    canvasBackground,
    selectedLayer,
    selectedFrame,
    selectedTool,
    previousTool,
    selectedColour,
    setSelectedColour,
    setSelectedTool,
    setPreviousTool,
  } = useArtStore();

  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasBackgroundRef = useRef<HTMLCanvasElement>(null);
  const canvasRefs = useRef<RefObject<HTMLCanvasElement>[]>([]);
  const evCacheRefs = useRef<React.PointerEvent<HTMLDivElement>[]>([]);

  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    setCanvasZoom((prevZoom) => {
      const newZoom = prevZoom + event.deltaY / 1000;
      return Math.min(Math.max(newZoom, 0.25), 3);
    });
  };

  // Functions
  const handleResize = () => {
    if (windowRef.current && wrapperRef.current) {
      const windowRatio =
        windowRef.current.clientWidth / windowRef.current.clientHeight;
      const canvasRatio =
        wrapperRef.current.clientWidth / wrapperRef.current.clientHeight;

      if (windowRatio > canvasRatio) {
        setDominantDimension("height");
      } else if (windowRatio < canvasRatio) {
        setDominantDimension("width");
      } else {
        if (windowRatio > 1) {
          setDominantDimension("width");
        } else {
          setDominantDimension("height");
        }
      }
    }
  };

  const toggleTools = () => {
    let prevTool = previousTool;
    let currentTool = selectedTool;

    [prevTool, currentTool] = [currentTool, prevTool];
    setSelectedTool(currentTool);
    setPreviousTool(prevTool);
  };

  const actionTool = async ({
    normalisedX,
    normalisedY,
  }: {
    normalisedX: number;
    normalisedY: number;
  }) => {
    const currentFrame = canvasRefs.current[selectedLayer].current;
    const currentContext = currentFrame?.getContext("2d", {
      willReadFrequently: true,
    });

    if (!currentContext) return;
    const updatedArtwork = { ...liveArtwork };

    await activateDrawingTool(
      selectedTool,
      selectedColour,
      { x: 1, y: 1 },
      normalisedX,
      normalisedY,
      updatedArtwork,
      selectedLayer,
      selectedFrame,
      currentFrame!,
      currentContext,
      setSelectedColour,
      canvasSize,
    ).then((data) => {
      setLiveArtwork(data);

      if (DRAWING_TOOLS[selectedTool].doAfter) {
        toggleTools();
      }
      setHasChanged(true);
    });
  };

  useEffect(() => {
    let intervalId = setInterval(() => {
      checkAndSave().then();
    }, saveInterval);

    const checkAndSave = async () => {
      if (hasChanged) {
        setIsSaving(true);
        await saveArtwork(liveArtwork);

        setTimeout(() => {
          setIsSaving(false);
          setHasChanged(false);
        }, 3000);
      }
    };

    return () => clearInterval(intervalId);
  }, [hasChanged]);

  // ON MOUNT
  useEffect(() => {
    // 1. Switch isLoading on
    // 2. Colour Background
    // 3. Populate canvasRefs from Artwork
    // 4. Switch isLoading off
    setIsLoading(true);

    const backgroundCanvas = canvasBackgroundRef.current;
    if (backgroundCanvas) colourBackground(canvasBackground, backgroundCanvas);

    canvasRefs.current = [];
    for (const _ of liveArtwork.layers) {
      const toInject: RefObject<HTMLCanvasElement> =
        createRef<HTMLCanvasElement>();
      canvasRefs.current.push(toInject);
    }

    requestAnimationFrame(async () => {
      canvasRefs.current.forEach((layer, index) => {
        if (!layer.current) return;

        const canvas: HTMLCanvasElement = layer.current!;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        const ctx: CanvasRenderingContext2D | null | undefined =
          canvasRefs.current[index].current?.getContext("2d", {
            willReadFrequently: true,
          });

        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          const injectData =
            liveArtwork.layers[index].frames[selectedFrame + 1] ||
            new ImageData(1, 1);

          ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
          ctx.putImageData(injectData, 0, 0);
        }
      });
    });

    handleResize();
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Render
  return !isLoading ? (
    <section className={`grid place-items-center w-full h-full`}>
      <PuffLoader size={40} color="green" />
    </section>
  ) : (
    <section
      ref={windowRef}
      className={`grid place-items-center w-full h-full`}
      onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
        if (
          (event.pointerType === "mouse" &&
            event.button === MouseButtons.MiddleClick) ||
          (event.pointerType === "touch" &&
            evCacheRefs.current.length === Touches.FourFingers)
        ) {
          setStartMoving(false);

          const timeNow = Date.now();
          const DOUBLE_CLICK_DELAY: number = 500;

          if (timeNow - doubleClickTime < DOUBLE_CLICK_DELAY) {
            setCanvasZoom(1);
            setCanvasPosition({ x: 0, y: 0 });

            setDoubleClickTime(0);
          } else {
            setDoubleClickTime(timeNow);
          }
        }
      }}
    >
      {startMoving ? (
        <IconHandGrab
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
      ) : (
        <IconCrosshair
          size={pixelReference / 1.5}
          className={`pointer-events-none fixed text-neutral-100 z-50 ${
            mouseInCanvas ? "block" : "hidden"
          }`}
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
      )}

      <article
        ref={wrapperRef}
        className={`${mouseInCanvas ? "cursor-none" : ""} mx-auto relative ${
          dominantDimension === "width" ? "w-[90%]" : "h-[90%]"
        } border border-neutral-100`}
        style={{
          aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${canvasZoom})`,
        }}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={handleZoom}
        onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;

          setMousePosition({ x: clientX, y: clientY });
          setPixelReference(width / canvasSize.width);

          const { normalisedX, normalisedY } = currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );

          if (event.pointerType === "mouse") {
            // Mouse
            // ==> left-click applies tools with "down" trigger
            // ==> middle-click moves canvas
            if (event.button === MouseButtons.LeftClick) {
              if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                setStartDrawing(true);
                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
            } else if (event.button === MouseButtons.MiddleClick) {
              setStartMoving(true);
            }
          } else if (event.pointerType === "touch") {
            // Touch
            // ==> one finger applies tools with "down" trigger
            // ==> four fingers moves canvas
            evCacheRefs.current.push(event);
            if (evCacheRefs.current.length === 1) {
              if (DRAWING_TOOLS[selectedTool].trigger === "down") {
                setStartDrawing(true);
                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
            } else if (evCacheRefs.current.length === Touches.FourFingers) {
              setStartMoving(true);
            }
          } else if (event.pointerType === "pen") {
            // Stylus
            // ==> applies tools with "down" trigger
            // ==> if button is pressed, use "eraser" tool
            if (DRAWING_TOOLS[selectedTool].trigger === "down") {
              setStartDrawing(true);
              requestAnimationFrame(async () => {
                await actionTool({ normalisedX, normalisedY });
              });
            }
          }
        }}
        onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;
          const { normalisedX, normalisedY } = currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );

          if (event.pointerType === "mouse") {
            // Mouse
            // ==> left-click applies tools with "up" trigger
            // ==> middle-click toggles previous and current tools
            if (event.button === MouseButtons.LeftClick) {
              if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
            } else if (event.button === MouseButtons.MiddleClick) {
              toggleTools();
            }
          } else if (event.pointerType === "touch") {
            // Touch
            // ==> one finger applies tools with "up" trigger
            // ==> two fingers undo last action
            // ==> three fingers redo last action
            // ==> four fingers handleResize
            if (evCacheRefs.current.length === Touches.OneFinger) {
              if (DRAWING_TOOLS[selectedTool].trigger === "up") {
                requestAnimationFrame(async () => {
                  await actionTool({ normalisedX, normalisedY });
                });
              }
            } else if (evCacheRefs.current.length === Touches.TwoFingers) {
              // Undo last action
            } else if (evCacheRefs.current.length === Touches.ThreeFingers) {
              // Redo last action
            }
          } else if (event.pointerType === "pen") {
            if (DRAWING_TOOLS[selectedTool].trigger === "up") {
              requestAnimationFrame(async () => {
                await actionTool({ normalisedX, normalisedY });
              });
            }
          }

          // Stop Drawing
          setStartDrawing(false);
          // Stop Moving Canvas
          setStartMoving(false);
        }}
        onPointerMove={async (event: React.PointerEvent<HTMLDivElement>) => {
          const target = event.target as HTMLElement;
          const getRect = target.getBoundingClientRect();
          const { clientX, clientY } = event;
          const { x, y, width, height } = getRect;

          setMousePosition({ x: clientX, y: clientY });
          setPixelReference(width / canvasSize.width);
          setMouseInCanvas(true);

          const { normalisedX, normalisedY } = currentMousePosition(
            clientX,
            clientY,
            canvasSize,
            target,
            x,
            y,
            width,
            height,
          );

          if (startDrawing) {
            requestAnimationFrame(async () => {
              await actionTool({ normalisedX, normalisedY });
            });
          } else if (startMoving) {
            setCanvasPosition((prevPosition) => ({
              x: prevPosition.x + event.movementX,
              y: prevPosition.y + event.movementY,
            }));
          }
        }}
        onPointerEnter={() => setMouseInCanvas(true)}
        onPointerOut={() => {
          setMouseInCanvas(false);
          // Stop Drawing
          setStartDrawing(false);
          // Stop Moving Canvas
          setStartMoving(false);
        }}
      >
        {/* Background Layer */}
        <canvas
          ref={canvasBackgroundRef}
          className={`absolute top-0 left-0 w-full h-full`}
          style={{
            imageRendering: "pixelated",
          }}
          width={16}
          height={16}
        ></canvas>

        {canvasRefs.current.map((layer, index) => {
          const isVisible = liveArtwork.layers[index].visible;

          return (
            <CanvasLayer
              ref={layer}
              key={`live-drawing-area-layer-${index}`}
              className={isVisible ? "block" : "hidden"}
              canvasSize={canvasSize}
              frame={liveArtwork.layers[index].frames[selectedFrame]}
            />
          );
        })}
      </article>
    </section>
  );
};

export default LiveDrawingArea;
