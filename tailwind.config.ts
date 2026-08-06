import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        enertrack: {
          orange: {
            main: "#fe6e00",
            secondary: "#ff8b1a",
            dark: "#c53c00",
          },
          slate: {
            950: "#0a0a0a",
            900: "#111827",
            800: "#1f2937",
          },
          green: {
            success: "#00c758",
            light: "#05df72",
          },
          blue: {
            accent: "#3080ff",
            dark: "#162456",
          },
          white: "#ffffff",
          gray: {
            light: "#f8fafc",
          }
        }
      }
    },
  },
  plugins: [],
};
export default config;