import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import flowbite from 'flowbite/plugin';
import tailwindcssAnimate from 'tailwindcss-animate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    join(__dirname, 'index.html'),
    join(__dirname, 'src/**/*.{js,jsx}'),
    join(__dirname, '../node_modules/flowbite/**/*.js'),
    join(__dirname, '../node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}')
  ],
  theme: {
    extend: {}
  },
  plugins: [flowbite, tailwindcssAnimate]
};
