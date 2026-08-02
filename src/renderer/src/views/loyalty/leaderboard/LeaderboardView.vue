<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import AccountEditModal from '@renderer/components/loyalty/AccountEditModal.vue'
import CsvImportModal from '@renderer/components/loyalty/CsvImportModal.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { activeLocaleTag } from '@renderer/i18n'
import type { AccountEditFormState } from '../types'
import { applyPointsToAll, applyPointsToSelection, submitAccountEdit } from '../functions'

const { t } = useI18n()
const store = useLoyaltyStore()

const selectedLogins = ref<Set<string>>(new Set())
const pointsAmount = ref(100)
const searchQuery = ref('')
const isEditModalOpen = ref(false)
const isCsvImportModalOpen = ref(false)
const activeEditForm = ref<AccountEditFormState>({ userLogin: '', balance: 0 })
const resultMessage = ref<string | null>(null)

const filtered = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return store.leaderboard
  return store.leaderboard.filter((entry) => entry.userLogin.toLowerCase().includes(query))
})

function toggleSelection(userLogin: string, checked: boolean): void {
  if (checked) selectedLogins.value.add(userLogin)
  else selectedLogins.value.delete(userLogin)
  // Set-Mutationen sind fuer Vue nicht reaktiv -- Referenz neu setzen.
  selectedLogins.value = new Set(selectedLogins.value)
}

async function applyToSelection(direction: 'give' | 'remove'): Promise<void> {
  if (selectedLogins.value.size === 0) return
  await applyPointsToSelection(store, [...selectedLogins.value], pointsAmount.value, direction)
  selectedLogins.value = new Set()
}

function openEditModal(userLogin: string, balance: number): void {
  activeEditForm.value = { userLogin, balance }
  isEditModalOpen.value = true
}

async function handleEditSubmit(form: AccountEditFormState): Promise<void> {
  await submitAccountEdit(store, form)
  isEditModalOpen.value = false
}

function openImportCsv(): void {
  resultMessage.value = null
  isCsvImportModalOpen.value = true
}

function handleCsvImported(result: { importedCount: number; errors: string[] }): void {
  isCsvImportModalOpen.value = false
  resultMessage.value =
    result.errors.length === 0
      ? t('loyalty.leaderboard.imported', { count: result.importedCount })
      : t('loyalty.leaderboard.importedWithErrors', {
          count: result.importedCount,
          errorCount: result.errors.length,
          errors: result.errors.join('; ')
        })
}

async function exportCsv(): Promise<void> {
  resultMessage.value = null
  const result = await store.exportCsv()
  if (!result) return
  resultMessage.value = t('loyalty.leaderboard.exported', { count: result.exportedCount })
}

async function blacklist(userLogin: string): Promise<void> {
  selectedLogins.value.delete(userLogin)
  await store.setBlacklisted(userLogin, true)
}

function formatBalance(balance: number): string {
  return balance.toLocaleString(activeLocaleTag())
}
</script>

<template>
  <PageSection :title="$t('loyalty.leaderboard.title')" :divided="false">
    <template #actions>
      <AppButton size="sm" @click="openImportCsv">{{ $t('loyalty.leaderboard.importCsv') }}</AppButton>
      <AppButton size="sm" @click="exportCsv">{{ $t('loyalty.leaderboard.exportCsv') }}</AppButton>
    </template>

    <p v-if="resultMessage" class="text-xs text-fg-muted">{{ resultMessage }}</p>
    <p v-if="store.error" class="text-xs text-danger">{{ store.error }}</p>

    <div class="mt-2 flex flex-wrap items-end gap-3">
      <div class="min-w-48 flex-1">
        <AppInput v-model="searchQuery" :placeholder="$t('loyalty.leaderboard.searchPlaceholder')" />
      </div>
      <div class="w-28">
        <AppInput
          v-model="pointsAmount"
          type="number"
          :min="1"
          :label="$t('loyalty.leaderboard.points')"
        />
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <AppButton
        size="sm"
        variant="primary"
        :disabled="selectedLogins.size === 0"
        @click="applyToSelection('give')"
      >
        {{ $t('loyalty.leaderboard.giveSelected') }}
      </AppButton>
      <AppButton
        size="sm"
        variant="danger"
        :disabled="selectedLogins.size === 0"
        @click="applyToSelection('remove')"
      >
        {{ $t('loyalty.leaderboard.removeSelected') }}
      </AppButton>
      <span class="mx-1 h-4 w-px bg-line" aria-hidden="true" />
      <AppButton size="sm" @click="applyPointsToAll(store, pointsAmount, 'give')">
        {{ $t('loyalty.leaderboard.giveAll') }}
      </AppButton>
      <AppButton size="sm" @click="applyPointsToAll(store, pointsAmount, 'remove')">
        {{ $t('loyalty.leaderboard.removeAll') }}
      </AppButton>
    </div>

    <EmptyState
      v-if="store.leaderboard.length === 0"
      class="mt-4"
      :title="$t('loyalty.leaderboard.empty')"
      :description="$t('loyalty.leaderboard.emptyHint')"
    >
      <template #icon><Trophy class="h-8 w-8" /></template>
    </EmptyState>

    <EmptyState
      v-else-if="filtered.length === 0"
      class="mt-4"
      :title="$t('loyalty.leaderboard.noMatches', { query: searchQuery })"
    />

    <ol v-else class="mt-4 divide-y divide-line border-t border-line">
      <li
        v-for="entry in filtered"
        :key="entry.userLogin"
        class="flex items-center justify-between gap-4 py-2 text-sm"
      >
        <label class="flex min-w-0 items-center gap-3">
          <input
            type="checkbox"
            class="h-4 w-4 shrink-0 accent-accent"
            :checked="selectedLogins.has(entry.userLogin)"
            @change="
              toggleSelection(entry.userLogin, ($event.target as HTMLInputElement).checked)
            "
          />
          <span class="w-8 shrink-0 text-right tabular-nums text-fg-subtle">#{{ entry.rank }}</span>
          <span class="truncate text-fg">{{ entry.userLogin }}</span>
        </label>
        <span class="flex shrink-0 items-center gap-2">
          <span class="font-medium tabular-nums text-fg">{{ formatBalance(entry.balance) }}</span>
          <AppButton
            size="sm"
            variant="ghost"
            @click="openEditModal(entry.userLogin, entry.balance)"
          >
            {{ $t('common.edit') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="blacklist(entry.userLogin)">
            {{ $t('loyalty.leaderboard.blacklistUser') }}
          </AppButton>
        </span>
      </li>
    </ol>

    <AccountEditModal
      v-if="isEditModalOpen"
      :initial="activeEditForm"
      @close="isEditModalOpen = false"
      @submit="handleEditSubmit"
    />

    <CsvImportModal
      v-if="isCsvImportModalOpen"
      @close="isCsvImportModalOpen = false"
      @imported="handleCsvImported"
    />
  </PageSection>
</template>
