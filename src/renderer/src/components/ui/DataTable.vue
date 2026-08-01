<script setup lang="ts" generic="T">
export interface DataTableColumn {
  /** Stabiler Schluessel, zugleich Slot-Name fuer die Zellendarstellung. */
  key: string
  label: string
  align?: 'left' | 'right'
  /** Tailwind-Breitenklasse, z.B. 'w-24'. */
  width?: string
}

withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    rows: T[]
    /** Eindeutiger Schluessel je Zeile. */
    rowKey: (row: T, index: number) => string | number
    /** Maximalhoehe des scrollbaren Bereichs, z.B. 'max-h-96'. */
    maxHeight?: string
  }>(),
  { maxHeight: undefined }
)
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-line">
    <div class="custom-scrollbar overflow-auto" :class="maxHeight">
      <table class="w-full border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-surface-subtle">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-fg-muted"
              :class="[column.align === 'right' ? 'text-right' : 'text-left', column.width]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td :colspan="columns.length" class="p-0">
              <slot name="empty" />
            </td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            v-else
            :key="rowKey(row, index)"
            class="border-t border-line transition-colors hover:bg-surface-subtle"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-2.5 align-middle text-fg"
              :class="column.align === 'right' && 'text-right'"
            >
              <slot :name="column.key" :row="row" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
