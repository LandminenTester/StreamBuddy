<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'secondary', size: 'md', type: 'button', disabled: false, loading: false }
)

const VARIANT_CLASSES = {
  primary: 'bg-accent text-accent-fg hover:opacity-90',
  secondary: 'border border-line-strong text-fg hover:bg-surface-subtle',
  ghost: 'text-fg-muted hover:bg-surface-subtle hover:text-fg',
  danger: 'border border-danger/40 text-danger hover:bg-danger-bg'
} as const

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2'
} as const

const classes = computed(() => [VARIANT_CLASSES[props.variant], SIZE_CLASSES[props.size]])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
    :class="classes"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
    <slot name="icon" />
    <slot />
  </button>
</template>
