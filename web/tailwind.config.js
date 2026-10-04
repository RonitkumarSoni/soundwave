/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A0A0A",
        secondary: "#111111",
        surface: "#181818",
        border: "rgba(255,255,255,0.06)",
        accent: {
          green: "#1DB954",
          blue: "#00A8E1",
          purple: "#8B5CF6",
          orange: "#FF9900",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
