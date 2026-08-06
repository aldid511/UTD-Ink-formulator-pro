/* Arctic Frost theme (theme-factory): ice blue #d4e4f7, steel blue #4a6fa5,
   silver #c0c0c0, crisp white #fafafa. The app's sky/slate/emerald/blue
   utility classes are remapped so the theme applies everywhere. */
module.exports = {
  content: ['./index.html', './*.tsx', './components/**/*.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#eef3fa', 100: '#dce7f4', 200: '#c0d3ea', 300: '#9cb9dc',
          400: '#7093c4', 500: '#4a6fa5', 600: '#3e5d8b', 700: '#344d73',
          800: '#2b3f5d', 900: '#24344c', 950: '#172130'
        },
        blue: {
          50: '#eef3fa', 100: '#dce7f4', 200: '#c0d3ea', 300: '#9cb9dc',
          400: '#7093c4', 500: '#4a6fa5', 600: '#3e5d8b', 700: '#344d73',
          800: '#2b3f5d', 900: '#24344c', 950: '#172130'
        },
        slate: {
          50: '#fafafa', 100: '#f1f4f8', 200: '#dfe6ee', 300: '#c0c0c0',
          400: '#9aa5b5', 500: '#71809a', 600: '#55637e', 700: '#3e4a63',
          800: '#2c374d', 900: '#202c40', 950: '#131b2a'
        },
        emerald: {
          50: '#f4f8fd', 100: '#e6eff9', 200: '#d4e4f7', 300: '#b3cfec',
          400: '#8fb6df', 500: '#6d9bcd', 600: '#547fb4', 700: '#446794',
          800: '#3a5578', 900: '#324763', 950: '#212e42'
        }
      }
    }
  },
  plugins: []
};
