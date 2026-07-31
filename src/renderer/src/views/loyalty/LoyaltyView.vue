<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import AccountEditModal from '@renderer/components/loyalty/AccountEditModal.vue'
import TabBar from '@renderer/components/shared/TabBar.vue'
import StatsCard from '@renderer/components/shared/StatsCard.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { AccountEditFormState } from './types'
import {
  EARN_RULE_LABELS,
  GAME_LABELS,
  TEXT_SLOT_LABELS,
  gameDisplayName,
  gameTextSlots,
  numericConfigEntries,
  resolvedTextVariants
} from './utils'
import {
  applyPointsToAll,
  applyPointsToSelection,
  renameGame,
  saveEarnRule,
  saveGameConfig,
  saveOfflineMessages,
  selectGame,
  submitAccountEdit,
  toggleGame,
  updateGameTextSlot,
  updateGameTrigger
} from './functions'

const store = useLoyaltyStore()
const selectedLogins = ref<Set<string>>(new Set())
const pointsAmount = ref(100)
const searchQuery = ref('')
const isEditModalOpen = ref(false)
const activeEditForm = ref<AccountEditFormState>({ userLogin: '', balance: 0 })
const importResultMessage = ref<string | null>(null)
const exportResultMessage = ref<string | null>(null)

const MAIN_TABS = [
  { key: 'leaderboard', label: 'Rangliste' },
  { key: 'blacklist', label: 'Blacklist' },
  { key: 'earnRules', label: 'Earn-Rules' },
  { key: 'games', label: 'Games' }
]
const activeTab = ref('leaderboard')

const activeGameId = ref('')
const gameTabs = computed(() =>
  store.games.map((game) => ({ key: game.gameId, label: gameDisplayName(game) }))
)
const activeGame = computed(() => store.games.find((g) => g.gameId === activeGameId.value) ?? null)

const offlineMessagesInput = ref<string[]>([])
watch(
  () => store.offlineMessages,
  (messages) => {
    offlineMessagesInput.value = [...messages]
  },
  { immediate: true }
)

watch(
  () => store.games,
  (games) => {
    if (!activeGameId.value && games.length > 0) {
      void handleSelectGame(games[0].gameId)
    }
  },
  { immediate: true }
)

const textSlotDrafts = reactive<Record<string, string[]>>({})
watch(
  activeGame,
  (game) => {
    if (!game) return
    for (const slot of gameTextSlots(game)) {
      textSlotDrafts[slot] = [...resolvedTextVariants(game, slot)]
    }
  },
  { immediate: true }
)

const filteredLeaderboard = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return store.leaderboard
  return store.leaderboard.filter((entry) => entry.userLogin.toLowerCase().includes(query))
})

onMounted(() => {
  void store.fetchLeaderboard()
  void store.fetchEarnRules()
  void store.fetchGames()
  void store.fetchBlacklist()
  void store.fetchOfflineMessages()
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

function handleTriggerChange(
  gameId: string,
  existingTriggers: Record<string, string>,
  commandKey: string,
  event: Event
): void {
  const value = (event.target as HTMLInputElement).value
  void updateGameTrigger(store, gameId, existingTriggers, commandKey, value)
}

function handleSaveTextSlot(
  gameId: string,
  existingTexts: Record<string, string[]>,
  slot: string
): void {
  void updateGameTextSlot(store, gameId, existingTexts, slot, textSlotDrafts[slot] ?? [])
}

async function handleSelectGame(gameId: string): Promise<void> {
  activeGameId.value = gameId
  await selectGame(store, gameId)
}

function handleSaveOfflineMessages(): void {
  void saveOfflineMessages(store, offlineMessagesInput.value)
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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('de-DE')
}

function colorEmoji(color: string): string {
  if (color === 'rot') return '🔴'
  if (color === 'schwarz') return '⚫'
  return '🟢'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Loyalty</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Eigene Kanal-Währung, verdienbar durch Follows, Subs, Gifted Subs und View-Time -- nur
        während der Stream live ist.
      </p>
    </div>

    <TabBar v-model="activeTab" :tabs="MAIN_TABS" />

    <section
      v-show="activeTab === 'leaderboard'"
      class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Rangliste</h2>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-neutral-700"
            @click="handleImportCsv"
          >
            CSV importieren
          </button>
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-neutral-700"
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
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2 text-xs dark:bg-neutral-900"
      >
        <label class="flex items-center gap-1.5">
          Punkte
          <input
            v-model.number="pointsAmount"
            type="number"
            min="1"
            class="w-20 rounded-md border border-slate-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800"
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
        <span class="mx-1 text-slate-300 dark:text-neutral-700">|</span>
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
          class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-neutral-900"
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

    <AccountEditModal
      v-if="isEditModalOpen"
      :initial="activeEditForm"
      @close="isEditModalOpen = false"
      @submit="handleEditSubmit"
    />

    <section
      v-show="activeTab === 'blacklist'"
      class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
    >
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Blacklist ({{ store.blacklist.length }})
      </h2>
      <p class="mt-1 text-xs text-slate-500">
        Geblacklistete Nutzer verdienen keine Punkte, erscheinen nicht in der Rangliste und können
        keine Loyalty-Games spielen.
      </p>
      <ul class="mt-3 space-y-1">
        <li v-if="store.blacklist.length === 0" class="py-2 text-center text-sm text-slate-500">
          Keine Nutzer geblacklistet.
        </li>
        <li
          v-for="account in store.blacklist"
          :key="account.userLogin"
          class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-neutral-900"
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

    <section
      v-show="activeTab === 'earnRules'"
      class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
    >
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
            class="border-t border-slate-100 dark:border-neutral-800"
          >
            <td class="py-2">{{ EARN_RULE_LABELS[rule.reason] }}</td>
            <td class="py-2">
              <input
                v-model.number="rule.points"
                type="number"
                min="0"
                class="w-24 rounded-md border border-slate-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                @change="handleRuleChange(index)"
              />
            </td>
            <td class="py-2">
              <input
                v-if="rule.reason === 'view_time'"
                v-model.number="rule.cooldownSeconds"
                type="number"
                min="30"
                class="w-24 rounded-md border border-slate-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
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

    <div v-show="activeTab === 'games'" class="space-y-6">
      <section class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Offline-Meldungen
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          Wird zufällig gesendet, wenn ein Loyalty-Game genutzt wird, während der Stream offline
          ist.
        </p>
        <StringListInput v-model="offlineMessagesInput" class="mt-2" />
        <button
          type="button"
          class="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          @click="handleSaveOfflineMessages"
        >
          Speichern
        </button>
      </section>

      <TabBar
        v-if="gameTabs.length > 0"
        :model-value="activeGameId"
        :tabs="gameTabs"
        @update:model-value="handleSelectGame"
      />

      <section
        v-if="activeGame"
        class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
      >
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">
              {{ GAME_LABELS[activeGame.gameId] ?? activeGame.gameId }}
            </p>
            <input
              type="text"
              :value="activeGame.displayName ?? ''"
              :placeholder="GAME_LABELS[activeGame.gameId] ?? activeGame.gameId"
              class="mt-0.5 w-48 rounded-md border border-slate-300 px-2 py-1 font-medium dark:border-neutral-700 dark:bg-neutral-900"
              @change="handleRenameGame(activeGame.gameId, $event)"
            />
          </div>
          <input
            type="checkbox"
            class="h-5 w-5 shrink-0 accent-twitch-purple"
            :checked="activeGame.enabled"
            @change="handleToggleGame(activeGame.gameId, $event)"
          />
        </div>

        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Einstellungen
          </h3>
          <div class="mt-2 flex flex-wrap gap-3">
            <label
              v-for="[key] in numericConfigEntries(activeGame.config)"
              :key="key"
              class="text-xs text-slate-500"
            >
              {{ key }}<span v-if="key === 'maxBet'"> (0 = kein Limit)</span>
              <input
                v-model.number="activeGame.config[key]"
                type="number"
                class="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                @change="handleConfigFieldChange(activeGame.gameId, activeGame.config)"
              />
            </label>
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Befehle</h3>
          <div class="mt-2 flex flex-wrap gap-3">
            <label
              v-for="command in activeGame.commands"
              :key="command.key"
              class="text-xs text-slate-500"
            >
              {{ command.key }}
              <input
                type="text"
                :value="command.trigger"
                class="mt-1 block w-28 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                @change="
                  handleTriggerChange(
                    activeGame.gameId,
                    activeGame.commandTriggers,
                    command.key,
                    $event
                  )
                "
              />
            </label>
          </div>
        </div>

        <div v-if="gameTextSlots(activeGame).length > 0" class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ansagetexte (mehrere Varianten möglich)
          </h3>
          <div class="mt-2 space-y-3">
            <div v-for="slot in gameTextSlots(activeGame)" :key="slot">
              <label class="text-xs text-slate-500">{{ TEXT_SLOT_LABELS[slot] ?? slot }}</label>
              <StringListInput v-model="textSlotDrafts[slot]" class="mt-1" />
              <button
                type="button"
                class="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                @click="handleSaveTextSlot(activeGame.gameId, activeGame.texts, slot)"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="activeGame.gameId === 'roulette' && store.rouletteColors.length > 0"
          class="mt-4"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Letzte Farben
          </h3>
          <p class="mt-1 text-lg leading-none">
            <span v-for="(color, index) in store.rouletteColors" :key="index">
              {{ colorEmoji(color) }}
            </span>
          </p>
        </div>

        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Statistik</h3>
          <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatsCard label="Wins" :value="String(store.gameStats?.winCount ?? 0)" />
            <StatsCard label="Losses" :value="String(store.gameStats?.lossCount ?? 0)" />
            <StatsCard
              label="Gewinnquote"
              :value="`${store.gameStats?.actualWinRatePercent ?? 0}%`"
            />
            <StatsCard
              label="Netto"
              :value="`${(store.gameStats?.totalWon ?? 0) - (store.gameStats?.totalLost ?? 0)}`"
            />
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Verlauf</h3>
          <table class="mt-2 w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="py-1">Zeit</th>
                <th class="py-1">Nutzer</th>
                <th class="py-1">Ergebnis</th>
                <th class="py-1">Betrag</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.gameHistory.length === 0">
                <td colspan="4" class="py-4 text-center text-slate-500">Noch keine Einträge.</td>
              </tr>
              <tr
                v-for="entry in store.gameHistory"
                :key="entry.id"
                class="border-t border-slate-100 dark:border-neutral-800"
              >
                <td class="py-1 text-xs text-slate-500">{{ formatDate(entry.createdAt) }}</td>
                <td class="py-1">{{ entry.userLogin }}</td>
                <td class="py-1">{{ entry.reason === 'game_win' ? 'Gewonnen' : 'Verloren' }}</td>
                <td
                  class="py-1 font-medium"
                  :class="entry.amount >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ entry.amount >= 0 ? '+' : '' }}{{ entry.amount }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
