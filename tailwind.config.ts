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
        sans: ["Poppins", ...require("tailwindcss/defaultTheme").fontFamily.sans],
      },
      colors: {
        primary: "#E85764",
        secondary: "#34374D",
      },
    },
  },
  plugins: [],
};
export default config;
