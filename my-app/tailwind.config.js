module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      backgroundImage: (theme) => ({
        "intro-page": "url('/src/assets/images/intro.jpg')",
      }),
      colors: {
        background: "#F9F4F5",
        primary: "#455a64",
        "primary-dark": "#3B4C54",
        "primary-light": "#718792",
      },
    },
    fontFamily: {
      sans: ["Open Sans", "sans-serif"],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
