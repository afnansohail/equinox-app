/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        card: "#151515",
        border: "#262626",
        primary: "#3B82F6",
        success: "#22C55E",
        danger: "#EF4444",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A3A3A3",
        "text-muted": "#737373",
        blue: {
          500: "#3B82F6",
          600: "#2563EB",
        },
        green: {
          500: "#22C55E",
          600: "#16A34A",
        },
        red: {
          500: "#EF4444",
          600: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
