// tailwind.config.js

/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";
import typography from "@tailwindcss/typography";

export default {
  // ✅ Class-based dark mode enabled
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#944e40", // Reddish-Brown from logo
          hover: "#7a3f33",
          light: "#b06d5e",
        },
      },
      textShadow: {
        DEFAULT: "0 2px 4px rgba(0,0,0,0.4)",
        lg: "0 4px 10px rgba(0,0,0,0.5)",
      },
      boxShadow: {
        "glow-brand": "0 4px 20px 0 rgba(148, 78, 64, 0.4)",
        "glow-teal": "0 4px 20px 0 rgba(13, 148, 136, 0.4)",
        "glow-white": "0 4px 20px 0 rgba(220, 220, 220, 0.4)",
        // ✅ --- ADDED RED GLOW ---
        "glow-red": "0 4px 20px 0 rgba(220, 38, 38, 0.4)",
        // ✅ --- END: ADDED ---
      },
      animation: {
        "ken-burns": "ken-burns 20s ease-out infinite",
      },
      keyframes: {
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "50%": { transform: "scale(1.1) translate(-2%, 2%)" },
          "100%": { transform: "scale(1) translate(0, 0)" },
        },
      },
    },
  },

  plugins: [
    typography,
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};