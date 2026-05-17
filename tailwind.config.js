/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 900: "#0a0a0a", 800: "#111111", 700: "#1a1a1a", 600: "#222222", 500: "#2a2a2a", 400: "#333333" },
        accent: { green: "#22c55e", yellow: "#eab308", red: "#ef4444", blue: "#3b82f6" },
      },
    },
  },
  plugins: [],
};

