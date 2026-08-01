<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { AccentColor, AppTheme } from '@shared/types/appInfo'
import { ACCENTS, ACCENT_KEYS } from '@renderer/theme/accents'
import { useThemeStore } from '@renderer/stores/theme.store'

const themeStore = useThemeStore()

const THEMES: AppTheme[] = ['light', 'dark', 'system']

/** Vorschau-Farbe des Farbfelds -- passend zum aktuell aufgeloesten Hell/Dunkel-Modus. */
function swatchStyle(accent: AccentColor): Record<string, string> {
  const variant = ACCENTS[accent][themeStore.isDark ? 'dark' : 'light']
  return { backgroundColor: `rgb(${variant.accent})`, color: `rgb(${variant.accentFg})` }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-xs font-medium text-fg-muted">{{ $t('settings.appearance.theme.label') }}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="option in THEMES"
          :key="option"
          type="button"
          class="rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :class="
            themeStore.theme === option
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-line-strong text-fg-muted hover:text-fg'
          "
          :aria-pressed="themeStore.theme === option"
          @click="themeStore.setTheme(option)"
        >
          {{ $t(`settings.appearance.theme.${option}`) }}
        </button>
      </div>
    </div>

    <div>
      <p class="text-xs font-medium text-fg-muted">{{ $t('settings.appearance.accent.label') }}</p>
      <div class="mt-2 flex flex-wrap gap-3">
        <button
          v-for="accent in ACCENT_KEYS"
          :key="accent"
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :style="swatchStyle(accent)"
          :aria-label="$t(ACCENTS[accent].labelKey)"
          :aria-pressed="themeStore.accent === accent"
          :title="$t(ACCENTS[accent].labelKey)"
          @click="themeStore.setAccent(accent)"
        >
          <Check v-if="themeStore.accent === accent" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
