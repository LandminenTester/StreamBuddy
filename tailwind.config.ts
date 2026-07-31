import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        twitch: {
          purple: '#9146FF'
        }
      }
    }
  },
  plugins: []
} satisfies Config
