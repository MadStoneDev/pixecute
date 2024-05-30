type RawColour = Uint8ClampedArray;
type ColourObject = { colour: {}; alpha: number };
type GetColourResponse = RawColour | ColourObject;
type ColourFormat = "raw" | "hex" | "rgb" | "hsl";

const removeLeadingHash = (value: string) => value.replace(/^#/, "");
const addLeadingHash = (value: string) => `#${removeLeadingHash(value)}`;

const fixHex = (hex: string) => {
  hex = removeLeadingHash(hex);

  switch (hex.length) {
    case 2:
      return hex.repeat(3);

    case 3:
      return hex.repeat(2);

    case 6:
      return hex;

    default:
      return `000000`;
  }
};

const hexToRgb = (hex: string) => {
  let cleanHex = fixHex(hex);

  let pairs = cleanHex.match(/.{1,2}/g) || ["00", "00", "00"];
  let [r, g, b] = pairs.map((pair) => parseInt(pair, 16));

  return { r, g, b };
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  let [rDash, gDash, bDash] = [r / 255, g / 255, b / 255];

  let max = Math.max(rDash, gDash, bDash);
  let min = Math.min(rDash, gDash, bDash);
  let delta = max - min;

  let l = (max + min) / 2;
  let s = delta === 0 ? 0 : delta / (1 - Math.abs(l * 2 - 1));
  let h = 0;

  if (delta !== 0) {
    switch (max) {
      case rDash:
        h = 60 * (((gDash - bDash) / delta) % 6);
        break;
      case gDash:
        h = 60 * ((bDash - rDash) / delta + 2);
        break;
      case bDash:
        h = 60 * ((rDash - gDash) / delta + 4);
        break;
    }
  }

  if (h < 0) h += 350;

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }) => {
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;

  let [rDash, gDash, bDash] = [0, 0, 0];

  if (h >= 0 && h < 60) {
    [rDash, gDash, bDash] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [rDash, gDash, bDash] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [rDash, gDash, bDash] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [rDash, gDash, bDash] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [rDash, gDash, bDash] = [x, 0, c];
  } else {
    [rDash, gDash, bDash] = [c, 0, x];
  }

  let [r, g, b] = [255 * (rDash + m), 255 * (gDash + m), 255 * (bDash + m)];

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
  let toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string) => {
  let rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
};

const hslToHex = (hsl: { h: number; s: number; l: number }) => {
  let rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
};

const imageDataToRGBA = (imageData: ImageData) => {
  let { data } = imageData;

  return {
    r: data[0],
    g: data[1],
    b: data[2],
    a: data[3] / 255,
  };
};

const colourObjectToRGBA = (colourData: ColourObject) => {
  const { r, g, b } = hexToRgb(colourData.colour as string);

  return `${r}, ${g}, ${b}, ${colourData.alpha / 255}`;
};

const compareColourObjects = (a: ColourObject, b: ColourObject) => {
  return (
    a.colour.toString().toUpperCase() === b.colour.toString().toUpperCase() &&
    a.alpha === b.alpha
  );
};

export {
  fixHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hslToHex,
  hexToHsl,
  imageDataToRGBA,
  colourObjectToRGBA,
  compareColourObjects,
};
