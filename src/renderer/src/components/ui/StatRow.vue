<script setup lang="ts">
export interface StatItem {
  key: string
  label: string
  value: string
}

defineProps<{ items: StatItem[] }>()
</script>

<template>
  <!--
    Kompakte Kennzahlenzeile: Werte stehen nebeneinander und werden nur durch
    Haarlinien getrennt -- bewusst keine einzelnen Karten.
  -->
  <dl class="flex flex-wrap items-stretch gap-x-8 gap-y-4">
    <div
      v-for="(item, index) in items"
      :key="item.key"
      class="min-w-24"
      :class="index > 0 && 'border-l border-line pl-8'"
    >
      <dt class="text-xs font-medium uppercase tracking-wide text-fg-muted">{{ item.label }}</dt>
      <dd class="mt-0.5 text-2xl font-semibold tabular-nums text-fg">
        <slot :name="item.key" :item="item">{{ item.value }}</slot>
      </dd>
    </div>
  </dl>
</template>
