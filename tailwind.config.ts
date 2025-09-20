import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./dist/**/*.{js,ts,jsx,tsx}",
    './src/**/*.{js,ts,jsx,tsx}',
    "./test/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config