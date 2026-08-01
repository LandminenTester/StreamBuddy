<script setup lang="ts">
import AppearancePicker from '@renderer/components/shared/AppearancePicker.vue'
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      {{ $t('setup.appearance.title') }}
    </h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.appearance.description') }}</p>

    <div class="mt-8 max-w-md">
      <AppearancePicker />
    </div>
  </div>
</template>
