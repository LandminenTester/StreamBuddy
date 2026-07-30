<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import AccountEditModal from '@renderer/components/loyalty/AccountEditModal.vue'
import type { AccountEditFormState } from './types'
import { EARN_RULE_LABELS, GAME_LABELS, numericConfigEntries } from './utils'
import {
  applyPointsToAll,
  applyPointsToSelection,
  renameGame,
  saveEarnRule,
  saveGameConfig,
  submitAccountEdit,
  toggleGame
} from './functions'

const store = useLoyaltyStore()
const selectedLogins = ref<Set<string>>(new Set())
const pointsAmount = ref(100)
const searchQuery = ref('')

const filteredLeaderboard = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return store.leaderboard
  return store.leaderboard.filter((entry) => entry.userLogin.toLowerCase().includes(query))
})
const isEditModalOpen = ref(false)
const activeEditForm = ref<AccountEditFormState>({ userLogin: '', balance: 0 })
const importResultMessage = ref<string | null>(null)
const exportResultMessage = ref<string | null>(null)

const isBlacklistOpen = ref(false)

onMounted(() => {
  void store.fetchLeaderboard()
  void store.fetchEarnRules()
  void store.fetchGames()
  void store.fetchBlacklist()
})

function handleRuleChange(index: number): void {
  void saveEarnRule(store, store.earnRules[index])
}

function handleToggleGame(gameId: string, event: Event): void {
  const enabled = (event.target as HTMLInputElement).checked
  void toggleGame(store, gameId, enabled)
}

function handleConfigFieldChange(gameId: string, config: Record<string, unknown>): void {
  void saveGameConfig(store, gameId, config)
}

function handleRenameGame(gameId: string, event: Event): void {
  const displayName = (event.target as HTMLInputElement).value
  void renameGame(store, gameId, displayName)
}

function toggleSelection(userLogin: string, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) selectedLogins.value.add(userLogin)
  else selectedLogins.value.delete(userLogin)
}

async function handleApplyToSelection(direction: 'give' | 'remove'): Promise<void> {
  if (selectedLogins.value.size === 0) return
  await applyPointsToSelection(store, [...selectedLogins.value], pointsAmount.value, direction)
  selectedLogins.value.clear()
}

async function handleApplyToAll(direction: 'give' | 'remove'): Promise<void> {
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

async function handleImportCsv(): Promise<void> {
  importResultMessage.value = null
  const result = await store.importCsv()
  if (!result) return
  importResultMessage.value =
    result.errors.length === 0
      ? `${result.importedCount} Konten importiert.`
      : `${result.importedCount} Konten importiert, ${result.errors.length} Fehler: ${result.errors.join('; ')}`
}

async function handleExportCsv(): Promise<void> {
  exportResultMessage.value = null
  const result = await store.exportCsv()
  if (!result) return
  exportResultMessage.value = `${result.exportedCount} Konten exportiert.`
}

async function handleBlacklist(userLogin: string): Promise<void> {
  selectedLogins.value.delete(userLogin)
  await store.setBlacklisted(userLogin, true)
}

async function handleUnblacklist(userLogin: string): Promise<void> {
  await store.setBlacklisted(userLogin, false)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Loyalty</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Eigene Kanal-Währung, verdienbar durch Follows, Subs, Gifted Subs und View-Time.
      </p>
    </div>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Rangliste</h2>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
            @click="handleImportCsv"
          >
            CSV importieren
          </button>
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
            @click="handleExportCsv"
          >
            CSV exportieren
          </button>
        </div>
      </div>

      <p v-if="importResultMessage" class="mt-2 text-xs text-slate-500">
        {{ importResultMessage }}
      </p>
      <p v-if="exportResultMessage" class="mt-2 text-xs text-slate-500">
        {{ exportResultMessage }}
      </p>
      <p v-if="store.error" class="mt-2 text-xs text-red-600">{{ store.error }}</p>

      <div class="mt-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nutzer suchen…"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-900"
      >
        <label class="flex items-center gap-1.5">
          Punkte
          <input
            v-model.number="pointsAmount"
            type="number"
            min="1"
            class="w-20 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <button
          class="rounded-md bg-twitch-purple px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-40"
          :disabled="selectedLogins.size === 0"
          @click="handleApplyToSelection('give')"
        >
          Ausgewählten geben
        </button>
        <button
          class="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-950"
          :disabled="selectedLogins.size === 0"
          @click="handleApplyToSelection('remove')"
        >
          Ausgewählten entziehen
        </button>
        <span class="mx-1 text-slate-300 dark:text-slate-700">|</span>
        <button
          class="rounded-md bg-twitch-purple px-3 py-1.5 font-medium text-white hover:opacity-90"
          @click="handleApplyToAll('give')"
        >
          Allen geben
        </button>
        <button
          class="rounded-md border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          @click="handleApplyToAll('remove')"
        >
          Allen entziehen
        </button>
      </div>

      <ol class="mt-3 space-y-1">
        <li v-if="store.leaderboard.length === 0" class="py-4 text-center text-sm text-slate-500">
          Noch keine Loyalty-Konten vorhanden.
        </li>
        <li
          v-else-if="filteredLeaderboard.length === 0"
          class="py-4 text-center text-sm text-slate-500"
        >
          Keine Treffer für "{{ searchQuery }}".
        </li>
        <li
          v-for="entry in filteredLeaderboard"
          :key="entry.userLogin"
          class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-slate-900"
        >
          <span class="flex items-center gap-3">
            <input
              type="checkbox"
              class="h-4 w-4 accent-twitch-purple"
              :checked="selectedLogins.has(entry.userLogin)"
              @change="toggleSelection(entry.userLogin, $event)"
            />
            <span class="w-6 text-right text-slate-400">#{{ entry.rank }}</span>
            <span>{{ entry.userLogin }}</span>
          </span>
          <span class="flex items-center gap-3">
            <span class="font-medium">{{ entry.balance.toLocaleString('de-DE') }}</span>
            <button
              class="text-xs text-slate-500 hover:text-twitch-purple"
              @click="openEditModal(entry.userLogin, entry.balance)"
            >
              Bearbeiten
            </button>
            <button
              class="text-xs text-slate-500 hover:text-red-600"
              @click="handleBlacklist(entry.userLogin)"
            >
              Blacklisten
            </button>
          </span>
        </li>
      </ol>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <button
        class="flex w-full items-center justify-between text-left"
        @click="isBlacklistOpen = !isBlacklistOpen"
      >
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Blacklist ({{ store.blacklist.length }})
        </h2>
        <span class="text-xs text-slate-400">{{ isBlacklistOpen ? '▲' : '▼' }}</span>
      </button>
      <p class="mt-1 text-xs text-slate-500">
        Geblacklistete Nutzer verdienen keine Punkte, erscheinen nicht in der Rangliste und können
        keine Loyalty-Games spielen.
      </p>
      <ul v-if="isBlacklistOpen" class="mt-3 space-y-1">
        <li v-if="store.blacklist.length === 0" class="py-2 text-center text-sm text-slate-500">
          Keine Nutzer geblacklistet.
        </li>
        <li
          v-for="account in store.blacklist"
          :key="account.userLogin"
          class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-slate-900"
        >
          <span>{{ account.userLogin }}</span>
          <button
            class="text-xs text-slate-500 hover:text-twitch-purple"
            @click="handleUnblacklist(account.userLogin)"
          >
            Entfernen
          </button>
        </li>
      </ul>
    </section>

    <AccountEditModal
      v-if="isEditModalOpen"
      :initial="activeEditForm"
      @close="isEditModalOpen = false"
      @submit="handleEditSubmit"
    />

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Earn-Rules</h2>
      <table class="mt-3 w-full text-left text-sm">
        <thead class="text-xs uppercase text-slate-500">
          <tr>
            <th class="py-1">Auslöser</th>
            <th class="py-1">Punkte</th>
            <th class="py-1">Intervall (Sek., nur View-Time)</th>
            <th class="py-1">Aktiv</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rule, index) in store.earnRules"
            :key="rule.reason"
            class="border-t border-slate-100 dark:border-slate-800"
          >
            <td class="py-2">{{ EARN_RULE_LABELS[rule.reason] }}</td>
            <td class="py-2">
              <input
                v-model.number="rule.points"
                type="number"
                min="0"
                class="w-24 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
                @change="handleRuleChange(index)"
              />
            </td>
            <td class="py-2">
              <input
                v-if="rule.reason === 'view_time'"
                v-model.number="rule.cooldownSeconds"
                type="number"
                min="30"
                class="w-24 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
                @change="handleRuleChange(index)"
              />
              <span v-else class="text-slate-400">–</span>
            </td>
            <td class="py-2">
              <input
                v-model="rule.enabled"
                type="checkbox"
                class="h-4 w-4 accent-twitch-purple"
                @change="handleRuleChange(index)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Loyalty-Games</h2>
      <ul class="mt-3 space-y-4">
        <li
          v-for="game in store.games"
          :key="game.gameId"
          class="rounded-md border border-slate-100 p-3 dark:border-slate-800"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-xs text-slate-500">{{ GAME_LABELS[game.gameId] ?? game.gameId }}</p>
              <input
                type="text"
                :value="game.displayName ?? ''"
                :placeholder="GAME_LABELS[game.gameId] ?? game.gameId"
                class="mt-0.5 w-48 rounded-md border border-slate-300 px-2 py-1 font-medium dark:border-slate-700 dark:bg-slate-900"
                @change="handleRenameGame(game.gameId, $event)"
              />
              <p class="mt-1 text-xs text-slate-500">{{ game.commandTrigger }}</p>
            </div>
            <input
              type="checkbox"
              class="h-5 w-5 shrink-0 accent-twitch-purple"
              :checked="game.enabled"
              @change="handleToggleGame(game.gameId, $event)"
            />
          </div>
          <div class="mt-3 flex flex-wrap gap-3">
            <label
              v-for="[key] in numericConfigEntries(game.config)"
              :key="key"
              class="text-xs text-slate-500"
            >
              {{ key }}<span v-if="key === 'maxBet'"> (0 = kein Limit)</span>
              <input
                v-model.number="game.config[key]"
                type="number"
                class="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                @change="handleConfigFieldChange(game.gameId, game.config)"
              />
            </label>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
