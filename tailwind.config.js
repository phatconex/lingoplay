/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0D1A63',
        'primary-hover': '#1A2CA3',
        'primary-blue': '#2845D6',
        'primary-orange': '#F68048',
        'primary-green': '#2845D6',
        success: '#2845D6',
        error: '#FF4B4B',
        warning: '#F68048',
      },
    },
  },
  plugins: [],
}
