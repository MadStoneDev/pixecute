import type { Config } from "tailwindcss";

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
        sans: [
          "Poppins",
          ...require("tailwindcss/defaultTheme").fontFamily.sans,
        ],
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
        secondary: "#34374D",
      },
    },
  },
  plugins: [],
};
export default config;
