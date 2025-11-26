const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        slate: colors.slate,
        accent: {
          50: "#e0f2fe",
          100: "#bae6fd",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        surface: "#0b1220",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 35px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
