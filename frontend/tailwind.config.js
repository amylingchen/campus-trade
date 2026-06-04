/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        steel: "#536270",
        mav: "#0f4c81",
        signal: "#f58025",
        mint: "#2a9d8f",
        paper: "#f7f8f9"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 32, 42, 0.08)"
      }
    },
  },
  plugins: [],
};
