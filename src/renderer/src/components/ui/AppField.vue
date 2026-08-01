<script setup lang="ts">
defineProps<{
  /** Sichtbares Label; entfaellt bei rein visuell beschrifteten Feldern. */
  label?: string
  /** Erklaerender Hinweis unter dem Feld. */
  hint?: string
  /** Fehlermeldung; ersetzt den Hinweis und faerbt das Feld. */
  error?: string
  /** ID des Eingabefelds fuer die label-for-Verknuepfung. */
  fieldId: string
}>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="fieldId" class="block text-xs font-medium text-fg-muted">
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-fg-subtle">{{ hint }}</p>
  </div>
</template>
