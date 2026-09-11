/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resq: {
          primary: '#1a365d',
          secondary: '#2b6cb0',
          accent: '#ed8936',
          danger: '#e53e3e',
          success: '#38a169',
          warning: '#d69e2e',
          dark: '#1a202c',
          light: '#f7fafc',
        }
      }
    },
  },
  plugins: [],
}
