/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4b0082",
        accent: "#ffd700",
        'text-main': "#f5f5f5",
        'bg-dark': "#0a0a0c",
      },
      fontFamily: {
        alice: ["Alice", "serif"],
        script: ["Great Vibes", "cursive"],
        serif: ["Playfair Display", "serif"],
      }
    },
  },
  plugins: [],
}
