<script setup lang="ts">
export interface DefinitionItem {
  /** Stabiler Schluessel, zugleich Slot-Name fuer eigene Wert-Darstellung. */
  key: string
  label: string
  /** Textwert; wird ignoriert, wenn ein gleichnamiger Slot belegt ist. */
  value?: string
  /** Erklaerung unter dem Wert. */
  hint?: string
}

withDefaults(
  defineProps<{
    items: DefinitionItem[]
    /** Zweispaltig ab sm-Breite, sonst untereinander. */
    columns?: 1 | 2
  }>(),
  { columns: 2 }
)
</script>

<template>
  <dl
    class="grid gap-x-8 gap-y-5"
    :class="columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'"
  >
    <div v-for="item in items" :key="item.key" class="min-w-0">
      <dt class="text-xs font-medium uppercase tracking-wide text-fg-muted">{{ item.label }}</dt>
      <dd class="mt-1 break-words text-sm text-fg">
        <slot :name="item.key" :item="item">
          <span v-if="item.value">{{ item.value }}</span>
          <span v-else class="text-fg-subtle">—</span>
        </slot>
      </dd>
      <p v-if="item.hint" class="mt-1 text-xs text-fg-subtle">{{ item.hint }}</p>
    </div>
  </dl>
</template>
