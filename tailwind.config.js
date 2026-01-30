/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#1e1e1e',
        primary: '#a8c7fa',
        background: '#121212',
      },
    },
  },
  plugins: [],
}
