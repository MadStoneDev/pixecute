import type { Config } from "tailwindcss";

const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fonts: {
        sans: ["Poppins", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          100: "#FDE6DE",
          200: "#FCC9BD",
          300: "#F8A39B",
          400: "#F18080",
          500: "#E85764",
          600: "#C73F58",
          700: "#A72B4D",
          800: "#861B42",
          900: "#6F103B",
        },
        secondary: {
          100: "#F5F4F2",
          200: "#ECEAE6",
          300: "#C8C4C0",
          400: "#928E8A",
          500: "#34374D",
          600: "#3F3632",
          700: "#352822",
          800: "#2A1A16",
          900: "#23100D",
        },
      },
    },
  },
  plugins: [],
};
export default config;
