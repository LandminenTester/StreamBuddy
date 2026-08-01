import type { Config } from 'tailwindcss'

/**
 * Farben kommen aus den semantischen Tokens in
 * src/renderer/src/assets/styles/tokens.css. Die rgb(var(--x) / <alpha-value>)-Form
 * sorgt dafuer, dass Opacity-Modifier wie bg-accent/10 weiter funktionieren.
 */
const token = (name: string): string => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Twitch-Markenfarbe -- bleibt fix, unabhaengig vom gewaehlten Akzent
        // (z.B. Default-Farbe neuer Kanalpunkt-Rewards).
        twitch: {
          purple: '#9146FF'
        },
        accent: {
          DEFAULT: token('accent'),
          fg: token('accent-fg')
        },
        surface: {
          DEFAULT: token('bg'),
          subtle: token('bg-subtle'),
          elevated: token('bg-elevated')
        },
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle')
        },
        line: {
          DEFAULT: token('border'),
          strong: token('border-strong')
        },
        success: {
          DEFAULT: token('success'),
          bg: token('success-bg')
        },
        warning: {
          DEFAULT: token('warning'),
          bg: token('warning-bg')
        },
        danger: {
          DEFAULT: token('danger'),
          bg: token('danger-bg')
        }
      },
      // Ein blankes `border` ohne Farbangabe nutzt damit automatisch den Token.
      borderColor: {
        DEFAULT: token('border')
      }
    }
  },
  plugins: []
} satisfies Config
