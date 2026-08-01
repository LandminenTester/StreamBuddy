<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useLocaleStore } from '@renderer/stores/locale.store'

const localeStore = useLocaleStore()
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ $t('setup.welcome.title') }}</h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.welcome.description') }}</p>

    <div class="mt-8 max-w-sm space-y-2">
      <button
        v-for="option in localeStore.available"
        :key="option.value"
        type="button"
        class="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :class="
          localeStore.locale === option.value
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-line-strong text-fg hover:bg-surface-subtle'
        "
        :aria-pressed="localeStore.locale === option.value"
        @click="localeStore.setLocale(option.value)"
      >
        <span class="font-medium">{{ option.label }}</span>
        <Check v-if="localeStore.locale === option.value" class="h-4 w-4" />
      </button>
    </div>

    <p class="mt-6 max-w-lg text-xs text-fg-subtle">{{ $t('setup.welcome.botTextNote') }}</p>
  </div>
</template>
