<script setup lang="ts">
import { useThemeStore } from '@renderer/stores/theme.store'

const themeStore = useThemeStore()
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-2">
    <span class="text-xs text-fg-muted">{{ $t('settings.appearance.theme.dark') }}</span>
    <input
      type="checkbox"
      class="peer sr-only"
      :checked="themeStore.isDark"
      @change="themeStore.toggle()"
    />
    <span
      class="relative h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-accent"
    >
      <span
        class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface transition-transform peer-checked:translate-x-4"
      />
    </span>
  </label>
</template>
