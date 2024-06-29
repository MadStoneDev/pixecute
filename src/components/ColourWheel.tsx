import { useEffect, useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import useArtStore from "@/utils/Zustand";

export const ColourWheel = ({ className }: { className?: string }) => {
  // States
  const [isSwiping, setIsSwiping] = useState(false);
  const [extraDegrees, setExtraDegrees] = useState(0);
  const [originCenter, setOriginCenter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [maxColours, setMaxColours] = useState(30);
  const [sessionColours, setSessionColours] = useState<any[]>([]);

  // Zustand
  const {
    selectedColour,
    setSelectedColour,
    colourPalette,
    setColourPalette,
    addColourToPalette,
  } = useArtStore();

  // Refs
  const initialYRef = useRef(0);
  const radialRef = useRef<HTMLDivElement>(null);

  const handleColourPick = (colour: number) => {
    setSelectedColour(colour);
    sessionStorage.setItem("selectedColour", colour.toString());
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
          className={`left-0 w-full aspect-square rounded-full border-2 border-neutral-100/50 hover:scale-125 transition-all duration-500`}
          style={{
            backgroundColor: colourPalette[index],
          }}
          onClick={() => handleColourPick(index)}
        ></div>,
      );
    }

    if (colourBlock.length < maxColours) {
      for (let item = colourBlock.length; item < maxColours; item++) {
        colourBlock.push(
          <div
            key={`colour-palette-${item}`}
            className={`absolute left-0 w-full aspect-square flex justify-center items-center rounded-full border border-neutral-100/50 text-neutral-100/50 transition-all duration-500`}
            onClick={() => {}}
          >
            <IconPlus size={24} />
          </div>,
        );
      }
    }

    let selectColour = parseInt(
      sessionStorage.getItem("selectedColour") || "1",
    );
    if (selectColour > colourPalette.length) selectColour = 1;

    setSelectedColour(selectColour);
    sessionStorage.setItem("selectedColour", selectColour.toString());
    sessionStorage.setItem("colourPalette", colourPalette.toString());
    setSessionColours(colourBlock);
    setLoading(false);
  }, []);

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

  return (
    <article
      className={`flex-grow touch-none absolute top-0 left-0 w-32 lg:w-44 h-full overflow-hidden ${className}`}
      onPointerUp={() => setIsSwiping(false)}
      onPointerLeave={() => setIsSwiping(false)}
      onPointerMove={(event) => {
        if (isSwiping) {
          const { clientY } = event;

          const deltaY = clientY - initialYRef.current;
          setExtraDegrees((prev) => prev + deltaY * 0.5);
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
          console.log("Now");
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
              onClick={() => setSelectedColour(index)}
            >
              {colour}
            </div>
          ))}
        </div>

        {/*<section*/}
        {/*  className={`absolute top-1/2 -translate-y-1/2 w-[73%] aspect-square rounded-full transition-all duration-700 z-10`}*/}
        {/*  style={{*/}
        {/*    backgroundColor: colourPalette[selectedColour],*/}
        {/*    boxShadow: "inset 0 0 20px 5px rgba(0, 0, 0, 0.5)",*/}
        {/*  }}*/}
        {/*></section>*/}
      </section>
    </article>
  );
};
