/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    'transform',
    'transition-transform',
    'duration-300',
    'ease-in-out',
    'translate-x-0',
    'translate-x-full',
    'md:translate-x-0'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
