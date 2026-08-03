<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppCheckbox from '@renderer/components/ui/AppCheckbox.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
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
const manualUserLogin = ref('')
const isEditModalOpen = ref(false)
const isCsvImportModalOpen = ref(false)
const pendingAllAction = ref<'give' | 'remove' | null>(null)
const activeEditForm = ref<AccountEditFormState>({ userLogin: '', balance: 0 })
const resultMessage = ref<string | null>(null)

const filtered = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return store.leaderboard
  return store.leaderboard.filter((entry) => entry.userLogin.toLowerCase().includes(query))
})

const visibleSelectedCount = computed(
  () => filtered.value.filter((entry) => selectedLogins.value.has(entry.userLogin)).length
)

const allVisibleSelected = computed(
  () => filtered.value.length > 0 && visibleSelectedCount.value === filtered.value.length
)

function toggleSelection(userLogin: string, checked: boolean): void {
  if (checked) selectedLogins.value.add(userLogin)
  else selectedLogins.value.delete(userLogin)
  // Set-Mutationen sind fuer Vue nicht reaktiv -- Referenz neu setzen.
  selectedLogins.value = new Set(selectedLogins.value)
}

function selectVisible(): void {
  selectedLogins.value = new Set([
    ...selectedLogins.value,
    ...filtered.value.map((e) => e.userLogin)
  ])
}

function clearSelection(): void {
  selectedLogins.value = new Set()
}

async function applyToSelection(direction: 'give' | 'remove'): Promise<void> {
  if (selectedLogins.value.size === 0) return
  await applyPointsToSelection(store, [...selectedLogins.value], pointsAmount.value, direction)
  selectedLogins.value = new Set()
}

async function applyToManualUser(direction: 'give' | 'remove'): Promise<void> {
  const login = manualUserLogin.value.trim()
  if (!login) return
  await applyPointsToSelection(store, [login], pointsAmount.value, direction)
  manualUserLogin.value = ''
}

function requestApplyToAll(direction: 'give' | 'remove'): void {
  pendingAllAction.value = direction
}

async function confirmApplyToAll(): Promise<void> {
  if (!pendingAllAction.value) return
  const direction = pendingAllAction.value
  pendingAllAction.value = null
  await applyPointsToAll(store, pointsAmount.value, direction)
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
      <AppButton size="sm" @click="openImportCsv">{{
        $t('loyalty.leaderboard.importCsv')
      }}</AppButton>
      <AppButton size="sm" @click="exportCsv">{{ $t('loyalty.leaderboard.exportCsv') }}</AppButton>
    </template>

    <p v-if="resultMessage" class="text-xs text-fg-muted">{{ resultMessage }}</p>
    <p v-if="store.error" class="text-xs text-danger">{{ store.error }}</p>

    <div class="mt-2 flex flex-wrap items-end gap-3">
      <div class="min-w-48 flex-1">
        <AppInput
          v-model="searchQuery"
          :placeholder="$t('loyalty.leaderboard.searchPlaceholder')"
        />
      </div>
      <div class="w-28">
        <AppInput
          v-model="pointsAmount"
          type="number"
          :min="1"
          :label="$t('loyalty.leaderboard.points')"
        />
      </div>
      <div class="min-w-48 flex-1">
        <AppInput
          v-model="manualUserLogin"
          :placeholder="$t('loyalty.leaderboard.manualUserPlaceholder')"
        />
      </div>
    </div>

    <div
      v-if="filtered.length > 0"
      class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-subtle px-3 py-2"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <AppCheckbox
          :checked="allVisibleSelected"
          :label="$t('loyalty.leaderboard.selectAll')"
          @change="(checked) => (checked ? selectVisible() : clearSelection())"
        />
        <span class="h-4 w-px bg-line" aria-hidden="true" />
        <AppButton
          size="sm"
          variant="ghost"
          :disabled="selectedLogins.size === 0"
          @click="clearSelection"
        >
          {{ $t('loyalty.leaderboard.clearSelection') }}
        </AppButton>
        <span>
          {{ $t('loyalty.leaderboard.selectedCount', { count: selectedLogins.size }) }}
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
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
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <AppButton size="sm" @click="requestApplyToAll('give')">
        {{ $t('loyalty.leaderboard.giveAll') }}
      </AppButton>
      <AppButton size="sm" variant="danger" @click="requestApplyToAll('remove')">
        {{ $t('loyalty.leaderboard.removeAll') }}
      </AppButton>
      <AppButton
        size="sm"
        variant="primary"
        :disabled="!manualUserLogin.trim()"
        @click="applyToManualUser('give')"
      >
        {{ $t('loyalty.leaderboard.giveManual') }}
      </AppButton>
      <AppButton
        size="sm"
        variant="danger"
        :disabled="!manualUserLogin.trim()"
        @click="applyToManualUser('remove')"
      >
        {{ $t('loyalty.leaderboard.removeManual') }}
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
        <div class="flex min-w-0 items-center gap-3">
          <AppCheckbox
            :checked="selectedLogins.has(entry.userLogin)"
            @change="(checked) => toggleSelection(entry.userLogin, checked)"
          />
          <span class="w-8 shrink-0 text-right tabular-nums text-fg-subtle">#{{ entry.rank }}</span>
          <span class="truncate text-fg">{{ entry.userLogin }}</span>
        </div>
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

    <ConfirmModal
      v-if="pendingAllAction"
      :title="$t('loyalty.leaderboard.confirmAllTitle')"
      :message="
        pendingAllAction === 'give'
          ? $t('loyalty.leaderboard.confirmGiveAll', { amount: pointsAmount })
          : $t('loyalty.leaderboard.confirmRemoveAll', { amount: pointsAmount })
      "
      :confirm-label="
        pendingAllAction === 'give'
          ? $t('loyalty.leaderboard.giveAll')
          : $t('loyalty.leaderboard.removeAll')
      "
      :variant="pendingAllAction === 'remove' ? 'danger' : 'primary'"
      @close="pendingAllAction = null"
      @confirm="confirmApplyToAll"
    />
  </PageSection>
</template>
