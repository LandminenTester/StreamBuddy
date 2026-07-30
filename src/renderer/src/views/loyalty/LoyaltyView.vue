<script setup lang="ts">
import { onMounted } from 'vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { EARN_RULE_LABELS, GAME_LABELS, numericConfigEntries } from './utils'
import { saveEarnRule, saveGameConfig, toggleGame } from './functions'

const store = useLoyaltyStore()

onMounted(() => {
  void store.fetchLeaderboard()
  void store.fetchEarnRules()
  void store.fetchGames()
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
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Rangliste</h2>
      <ol class="mt-3 space-y-1">
        <li v-if="store.leaderboard.length === 0" class="py-4 text-center text-sm text-slate-500">
          Noch keine Loyalty-Konten vorhanden.
        </li>
        <li
          v-for="entry in store.leaderboard"
          :key="entry.userLogin"
          class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-slate-900"
        >
          <span class="flex items-center gap-3">
            <span class="w-6 text-right text-slate-400">#{{ entry.rank }}</span>
            <span>{{ entry.userLogin }}</span>
          </span>
          <span class="font-medium">{{ entry.balance.toLocaleString('de-DE') }}</span>
        </li>
      </ol>
    </section>

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
            <div>
              <p class="font-medium">{{ GAME_LABELS[game.gameId] ?? game.gameId }}</p>
              <p class="text-xs text-slate-500">{{ game.commandTrigger }}</p>
            </div>
            <input
              type="checkbox"
              class="h-5 w-5 accent-twitch-purple"
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
              {{ key }}
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
