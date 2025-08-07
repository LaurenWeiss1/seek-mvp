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
    extend: {
      backgroundSize: {
        '200': '200% 200%',
      },
      backgroundPosition: {
        '0': '0% 50%',
        '100': '100% 50%',
      },
      animation: {
        gradient: 'gradientMove 10s ease infinite',
      },
      keyframes: {
        gradientMove: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}