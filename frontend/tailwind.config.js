/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agriGreen: '#2F855A',
        agriDark: '#22543D',
        agriLight: '#C6F6D5',
      }
    },
  },
  plugins: [],
}