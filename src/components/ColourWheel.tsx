// components/ColourWheel.tsx

import { useEffect, useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import useArtStore from "@/utils/Zustand";
import { ColourPickerModal } from "@/components/ColourPickerModal";

export const ColourWheel = ({ className }: { className?: string }) => {
  // States
  const [isSwiping, setIsSwiping] = useState(false);
  const [extraDegrees, setExtraDegrees] = useState(0);
  const [originCenter, setOriginCenter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [maxColours, setMaxColours] = useState(36);
  const [sessionColours, setSessionColours] = useState<any[]>([]);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null,
  );

  // Zustand
  const {
    setSelectedColour,
    colourPalette,
    addColourToPalette,
    updateColourInPalette,
  } = useArtStore();

  // Refs
  const initialYRef = useRef(0);
  const radialRef = useRef<HTMLDivElement>(null);

  const handleColourPick = (colour: number) => {
    if (colour < colourPalette.length) {
      setSelectedColour(colourPalette[colour]);
    }
  };

  const handleEmptySlotClick = (index: number) => {
    setSelectedColorIndex(index);
    setColorPickerOpen(true);
  };

  const handleColorLongPress = (index: number) => {
    if (index < colourPalette.length) {
      setSelectedColorIndex(index);
      setColorPickerOpen(true);
    }
  };

  const handleMouseDown = (index: number) => {
    if (index < colourPalette.length) {
      // Start long press timer for existing colors
      const timer = setTimeout(() => {
        handleColorLongPress(index);
      }, 800); // 800ms for long press
      setLongPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleColorSelection = (color: string) => {
    if (selectedColorIndex !== null) {
      if (selectedColorIndex < colourPalette.length) {
        // Update existing color
        updateColourInPalette(color, selectedColorIndex);
      } else {
        // Add new color
        addColourToPalette(color);
      }
      setSelectedColour(color);
    }
    setSelectedColorIndex(null);
  };

  useEffect(() => {
    const colourBlock = [];

    for (
      let index = 0;
      index < maxColours && index < colourPalette.length;
      index++
    ) {
      colourBlock.push(
        <div
          key={`colour-palette-${index}`}
          className={`left-0 w-full aspect-square rounded-full border-2 border-neutral-100/50 hover:scale-125 transition-all duration-500 cursor-pointer`}
          style={{
            backgroundColor: colourPalette[index],
          }}
          onClick={() => handleColourPick(index)}
          onMouseDown={() => handleMouseDown(index)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={() => handleMouseDown(index)}
          onTouchEnd={handleMouseUp}
        ></div>,
      );
    }

    if (colourBlock.length < maxColours) {
      for (let item = colourBlock.length; item < maxColours; item++) {
        colourBlock.push(
          <div
            key={`colour-palette-${item}`}
            id={`colour-palette-${item}`}
            className={`${
              item > 12 && item < 33 ? "pointer-events-none opacity-0" : ""
            } absolute left-0 w-full aspect-square flex justify-center items-center rounded-full border border-neutral-100/50 text-neutral-100/50 hover:scale-125 hover:bg-neutral-100/20 transition-all duration-500 cursor-pointer`}
            onClick={() => handleEmptySlotClick(item)}
          >
            <IconPlus size={24} />
          </div>,
        );
      }
    }

    if (colourPalette.length > 0) {
      let selectColour = colourPalette[1] || colourPalette[0];
      setSelectedColour(selectColour);
    }
    setSessionColours(colourBlock);
    setLoading(false);
  }, [colourPalette, maxColours]);

  useEffect(() => {
    const handleResize = () => {
      let rotateAround = 0;

      if (radialRef.current) {
        rotateAround = radialRef.current.offsetWidth / 2;
        setOriginCenter(rotateAround);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <>
      <article
        className={`flex-grow touch-none absolute top-0 left-0 w-32 lg:w-44 h-full overflow-hidden ${className}`}
        onPointerUp={() => setIsSwiping(false)}
        onPointerLeave={() => setIsSwiping(false)}
        onPointerMove={(event) => {
          if (isSwiping) {
            const { clientY } = event;

            const deltaY = clientY - initialYRef.current;
            setExtraDegrees((prev) => {
              const newDegrees = prev + deltaY * 0.25;

              // 6.5 Degrees per Colour
              if (newDegrees < 56 && newDegrees > -47) return newDegrees;
              else return prev;
            });
            initialYRef.current = clientY;
          }
        }}
      >
        <section
          className={`absolute p-3 ${
            loading ? "right-full" : "right-0"
          } top-1/2 -translate-y-1/2 flex justify-center items-center w-[400%] lg:w-[400%] rounded-full bg-secondary shadow-xl shadow-neutral-900/50 transition-all duration-500`}
          style={{
            aspectRatio: 1,
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            const { clientY } = event;

            setIsSwiping(true);
            initialYRef.current = clientY;
          }}
        >
          <div
            ref={radialRef}
            className={`relative w-full h-full flex justify-center items-center rounded-full`}
            style={{
              transform: `rotate(${130 + extraDegrees}deg)`,
            }}
          >
            {sessionColours.map((colour, index) => (
              <div
                key={`colour-palette-${index}`}
                className={`cursor-pointer absolute left-0 w-8 h-8 rounded-full transition-all duration-500`}
                style={{
                  transformOrigin: originCenter + "px",
                  transform: `rotate(${(index * 360) / maxColours}deg)`,
                }}
              >
                {colour}
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* Color Picker Modal */}
      <ColourPickerModal
        isOpen={colorPickerOpen}
        onClose={() => {
          setColorPickerOpen(false);
          setSelectedColorIndex(null);
        }}
        initialColor={
          selectedColorIndex !== null &&
          selectedColorIndex < colourPalette.length
            ? colourPalette[selectedColorIndex]
            : "#ffffff"
        }
        onColorSelect={handleColorSelection}
      />
    </>
  );
};
