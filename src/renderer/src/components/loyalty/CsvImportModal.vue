<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileUp } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import {
  previewLoyaltyCsv,
  type CsvDelimiter,
  type LoyaltyCsvMapping
} from '@shared/utils/loyaltyCsv'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'

const emit = defineEmits<{
  close: []
  imported: [result: { importedCount: number; errors: string[] }]
}>()

const store = useLoyaltyStore()
const { t } = useI18n()
const fileName = ref('')
const content = ref('')
const delimiter = ref<CsvDelimiter>(',')
const mapping = ref<LoyaltyCsvMapping>({ userLoginColumn: 0, balanceColumn: 1 })
const isImporting = ref(false)

const delimiterOptions = computed<SelectOption[]>(() => [
  { value: ',', label: t('loyalty.leaderboard.csvImport.delimiterComma') },
  { value: ';', label: t('loyalty.leaderboard.csvImport.delimiterSemicolon') },
  { value: '\t', label: t('loyalty.leaderboard.csvImport.delimiterTab') }
])

const preview = computed(() => previewLoyaltyCsv(content.value, delimiter.value, mapping.value, 8))

const columnOptions = computed<SelectOption[]>(() =>
  preview.value.headers.map((header, index) => ({
    value: String(index),
    label: header || `Spalte ${index + 1}`
  }))
)

const canImport = computed(
  () =>
    content.value.length > 0 &&
    columnOptions.value.length > 0 &&
    mapping.value.userLoginColumn !== mapping.value.balanceColumn
)

const hasDuplicateMapping = computed(
  () => columnOptions.value.length > 0 && mapping.value.userLoginColumn === mapping.value.balanceColumn
)

watch(
  () => [content.value, delimiter.value] as const,
  () => {
    mapping.value = previewLoyaltyCsv(content.value, delimiter.value).mapping
  }
)

async function selectFile(): Promise<void> {
  const result = await store.selectImportCsv()
  if (!result) return
  fileName.value = result.fileName
  content.value = result.content
}

function setDelimiter(value: string): void {
  if (value === ',' || value === ';' || value === '\t') delimiter.value = value
}

async function importCsv(): Promise<void> {
  if (!canImport.value) return
  isImporting.value = true
  try {
    const result = await store.importCsv({
      content: content.value,
      delimiter: delimiter.value,
      mapping: mapping.value
    })
    if (result) emit('imported', result)
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <BaseModal
    :title="$t('loyalty.leaderboard.csvImport.title')"
    max-width="max-w-4xl"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-fg">
            {{ fileName || $t('loyalty.leaderboard.csvImport.noFile') }}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            {{ $t('loyalty.leaderboard.csvImport.description') }}
          </p>
        </div>
        <AppButton variant="ghost" @click="selectFile">
          <template #icon><FileUp class="h-4 w-4" /></template>
          {{ $t('loyalty.leaderboard.csvImport.selectFile') }}
        </AppButton>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <AppSelect
          :model-value="delimiter"
          :label="$t('loyalty.leaderboard.csvImport.delimiter')"
          :options="delimiterOptions"
          @update:model-value="setDelimiter"
        />
        <AppSelect
          :model-value="String(mapping.userLoginColumn)"
          :label="$t('loyalty.leaderboard.csvImport.userLoginColumn')"
          :options="columnOptions"
          :disabled="columnOptions.length === 0"
          @update:model-value="mapping = { ...mapping, userLoginColumn: Number($event) }"
        />
        <AppSelect
          :model-value="String(mapping.balanceColumn)"
          :label="$t('loyalty.leaderboard.csvImport.balanceColumn')"
          :options="columnOptions"
          :disabled="columnOptions.length === 0"
          @update:model-value="mapping = { ...mapping, balanceColumn: Number($event) }"
        />
      </div>

      <div class="overflow-hidden rounded border border-line">
        <div
          class="border-b border-line bg-surface-raised px-3 py-2 text-xs font-medium uppercase tracking-wide text-fg-muted"
        >
          {{ $t('loyalty.leaderboard.csvImport.preview') }}
        </div>
        <div v-if="preview.rows.length === 0" class="px-3 py-8 text-center text-sm text-fg-muted">
          {{ $t('loyalty.leaderboard.csvImport.emptyPreview') }}
        </div>
        <div v-else class="custom-scrollbar overflow-x-auto">
          <table class="w-full min-w-[36rem] text-left text-sm">
            <thead class="border-b border-line text-xs text-fg-muted">
              <tr>
                <th
                  v-for="(header, index) in preview.headers"
                  :key="`${index}:${header}`"
                  class="px-3 py-2 font-medium"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="(row, rowIndex) in preview.rows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="px-3 py-2 text-fg">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="preview.parsedRows.length > 0"
        class="rounded border border-line bg-surface-raised/60 px-3 py-2 text-xs text-fg-muted"
      >
        {{ $t('loyalty.leaderboard.csvImport.mappedPreview') }}:
        <span
          v-for="row in preview.parsedRows"
          :key="row.userLogin"
          class="mr-2 inline-flex rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent"
        >
          {{ row.userLogin }}: {{ row.balance }}
        </span>
      </div>

      <div
        v-if="hasDuplicateMapping"
        class="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
      >
        {{ $t('loyalty.leaderboard.csvImport.duplicateMapping') }}
      </div>

      <div
        v-if="preview.errors.length > 0"
        class="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
      >
        {{ preview.errors.join('; ') }}
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :disabled="!canImport || isImporting" @click="importCsv">
        {{ $t('loyalty.leaderboard.csvImport.import') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
