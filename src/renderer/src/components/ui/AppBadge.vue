<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
    /** Zeigt einen farbigen Punkt vor dem Text, z.B. fuer Verbindungszustaende. */
    dot?: boolean
  }>(),
  { variant: 'neutral', dot: false }
)

const VARIANT_CLASSES = {
  neutral: 'bg-surface-subtle text-fg-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent/10 text-accent'
} as const

const DOT_CLASSES = {
  neutral: 'bg-fg-subtle',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent'
} as const

const classes = computed(() => VARIANT_CLASSES[props.variant])
const dotClasses = computed(() => DOT_CLASSES[props.variant])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
    :class="classes"
  >
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full" :class="dotClasses" aria-hidden="true" />
    <slot />
  </span>
</template>
