<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    /**
     * Trennlinie oberhalb des Abschnitts. Bewusst der einzige Rahmen im Layout --
     * Abschnitte werden sonst nur ueber Weissraum und Typografie getrennt.
     */
    divided?: boolean
  }>(),
  { divided: true }
)
</script>

<template>
  <section :class="divided && 'border-t border-line pt-6'">
    <div v-if="title || $slots.actions" class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 v-if="title" class="text-base font-semibold text-fg">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-fg-muted">{{ description }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <div :class="(title || $slots.actions) && 'mt-4'">
      <slot />
    </div>
  </section>
</template>
