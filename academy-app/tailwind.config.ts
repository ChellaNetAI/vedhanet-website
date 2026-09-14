import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6d5bd0",
          dark: "#5643b8",
        },
        accentpink: {
          DEFAULT: "#ec4899",
          dark: "#d6317a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
