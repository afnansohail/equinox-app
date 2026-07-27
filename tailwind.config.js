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
        background: "#06100E",
        card: "#0F1A18",
        border: "#262626",
        primary: "#1FE3B6",
        success: "#34D399",
        danger: "#FF6B6B",
        "text-primary": "#F2F5F4",
        "text-secondary": "#B9C6C3",
        "text-muted": "#7C8B88",
        blue: {
          500: "#3B82F6",
          600: "#2563EB",
        },
        green: {
          500: "#34D399",
          600: "#22C55E",
        },
        red: {
          500: "#FF6B6B",
          600: "#E05555",
        },
      },
    },
  },
  plugins: [],
};
