/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.{html,js}',
    './assets/js/**/*.js', // adjust this according to your project structure
  ],
  theme: {
    extend: {
      colors: {
        customPurple: '#4B0082',
        // rgb(75, 0, 130)
        customTeal: '#008080',
        // rgb(0, 128, 128)
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};


