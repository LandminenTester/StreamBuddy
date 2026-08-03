<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import StatRow, { type StatItem } from '@renderer/components/ui/StatRow.vue'
import GameGeneralModal from '@renderer/components/games/GameGeneralModal.vue'
import GameConfigModal from '@renderer/components/games/GameConfigModal.vue'
import GameCommandsModal from '@renderer/components/games/GameCommandsModal.vue'
import GameTextsModal from '@renderer/components/games/GameTextsModal.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { activeLocaleTag } from '@renderer/i18n'
import type { LoyaltyDuelMatch, LoyaltyGameHistoryEntry } from '@shared/types/loyalty'
import {
  gameDisplayName,
  gameLabel,
  gameTextSlots,
  numericConfigEntries,
  resolvedTextVariants,
  textSlotLabel
} from '@renderer/views/loyalty/utils'
import { selectGame } from '@renderer/views/loyalty/functions'
import { fieldHint, fieldLabel, formatFieldValue } from './fieldMeta'

const { t } = useI18n()
const route = useRoute()
const store = useLoyaltyStore()

const openModal = ref<'general' | 'config' | 'commands' | 'texts' | null>(null)

const gameId = computed(() => route.params.gameId as string)
const game = computed(() => store.games.find((entry) => entry.gameId === gameId.value) ?? null)

onMounted(async () => {
  if (store.games.length === 0) await store.fetchGames()
  await selectGame(store, gameId.value)
})

watch(gameId, async (id) => {
  await selectGame(store, id)
})

const configItems = computed<DefinitionItem[]>(() =>
  game.value
    ? numericConfigEntries(game.value.config).map(([key, value]) => ({
        key,
        label: fieldLabel(key),
        value: formatFieldValue(key, value),
        hint: fieldHint(key)
      }))
    : []
)

const commandItems = computed<DefinitionItem[]>(() =>
  game.value
    ? game.value.commands.map((command) => ({
        key: command.key,
        label: command.key,
        value: command.trigger
      }))
    : []
)

const textItems = computed<DefinitionItem[]>(() =>
  game.value
    ? gameTextSlots(game.value).map((slot) => ({
        key: slot,
        label: textSlotLabel(slot),
        value: t('games.texts.variants', {
          count: resolvedTextVariants(game.value!, slot).length
        })
      }))
    : []
)

const stats = computed<StatItem[]>(() => [
  { key: 'wins', label: t('games.stats.wins'), value: String(store.gameStats?.winCount ?? 0) },
  { key: 'losses', label: t('games.stats.losses'), value: String(store.gameStats?.lossCount ?? 0) },
  {
    key: 'winRate',
    label: t('games.stats.winRate'),
    value: `${store.gameStats?.actualWinRatePercent ?? 0}%`
  },
  {
    key: 'net',
    label: t('games.stats.net'),
    value: String((store.gameStats?.totalWon ?? 0) - (store.gameStats?.totalLost ?? 0))
  }
])

const historyColumns = computed<DataTableColumn[]>(() => [
  { key: 'time', label: t('games.history.time') },
  { key: 'user', label: t('games.history.user') },
  { key: 'result', label: t('games.history.result') },
  { key: 'amount', label: t('games.history.amount'), align: 'right' }
])

const duelColumns = computed<DataTableColumn[]>(() => [
  { key: 'time', label: t('games.history.time') },
  { key: 'match', label: t('games.history.match') },
  { key: 'winner', label: t('games.history.winner') },
  { key: 'amount', label: t('games.history.amount'), align: 'right' }
])

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(activeLocaleTag())
}

function colorEmoji(color: string): string {
  if (color === 'rot') return '🔴'
  if (color === 'schwarz') return '⚫'
  return '🟢'
}

async function saveGeneral(payload: { displayName: string; enabled: boolean }): Promise<void> {
  if (!game.value) return
  const id = game.value.gameId
  if (payload.displayName !== (game.value.displayName ?? '')) {
    await store.renameGame(id, payload.displayName)
  }
  if (payload.enabled !== game.value.enabled) {
    await store.setGameEnabled(id, payload.enabled)
  }
  openModal.value = null
}

async function saveConfig(config: Record<string, unknown>): Promise<void> {
  if (!game.value) return
  await store.updateGameConfig(game.value.gameId, config)
  openModal.value = null
}

async function saveCommands(triggers: Record<string, string>): Promise<void> {
  if (!game.value) return
  await store.updateGameTriggers(game.value.gameId, triggers)
  openModal.value = null
}

async function saveTexts(texts: Record<string, string[]>): Promise<void> {
  if (!game.value) return
  await store.updateGameTexts(game.value.gameId, texts)
  openModal.value = null
}
</script>

<template>
  <div v-if="game" class="mx-auto max-w-3xl space-y-8">
    <div>
      <RouterLink
        :to="{ name: 'games' }"
        class="inline-flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        {{ $t('games.title') }}
      </RouterLink>

      <PageHeader class="mt-3" :title="gameDisplayName(game)" :description="gameLabel(game.gameId)">
        <template #actions>
          <AppBadge :variant="game.enabled ? 'success' : 'neutral'" dot>
            {{ game.enabled ? $t('common.enabled') : $t('common.disabled') }}
          </AppBadge>
          <AppButton size="sm" @click="openModal = 'general'">{{ $t('common.edit') }}</AppButton>
        </template>
      </PageHeader>
    </div>

    <PageSection :title="$t('games.sections.config')">
      <template #actions>
        <AppButton size="sm" @click="openModal = 'config'">{{ $t('common.edit') }}</AppButton>
      </template>
      <DefinitionList :items="configItems" />
    </PageSection>

    <PageSection :title="$t('games.sections.commands')">
      <template #actions>
        <AppButton size="sm" @click="openModal = 'commands'">{{ $t('common.edit') }}</AppButton>
      </template>
      <DefinitionList :items="commandItems">
        <template v-for="item in commandItems" #[item.key] :key="item.key">
          <code class="font-mono text-sm text-accent">{{ item.value }}</code>
        </template>
      </DefinitionList>
    </PageSection>

    <PageSection v-if="textItems.length > 0" :title="$t('games.sections.texts')">
      <template #actions>
        <AppButton size="sm" @click="openModal = 'texts'">{{ $t('common.edit') }}</AppButton>
      </template>
      <DefinitionList :items="textItems" />
    </PageSection>

    <PageSection
      v-if="game.gameId === 'roulette' && store.rouletteColors.length > 0"
      :title="$t('games.sections.recentRounds')"
    >
      <p class="text-lg leading-none">
        <span v-for="(round, index) in store.rouletteColors" :key="index" class="mr-2">
          {{ round.number ?? '?' }}{{ colorEmoji(round.color) }}
        </span>
      </p>
    </PageSection>

    <PageSection v-if="game.gameId !== 'duel'" :title="$t('games.sections.stats')">
      <StatRow :items="stats" />
    </PageSection>

    <PageSection v-if="game.gameId === 'duel'" :title="$t('games.sections.history')">
      <DataTable
        :columns="duelColumns"
        :rows="store.duelMatches"
        :row-key="(row: LoyaltyDuelMatch) => row.id"
        max-height="max-h-96"
      >
        <template #empty>
          <EmptyState :title="$t('games.history.empty')" />
        </template>
        <template #time="{ row }">
          <span class="text-xs text-fg-muted">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #match="{ row }">
          {{ $t('games.history.versus', { a: row.challengerLogin, b: row.opponentLogin }) }}
        </template>
        <template #winner="{ row }">
          <span class="font-medium text-success">{{ row.winnerLogin }}</span>
          <span class="text-fg-muted"> / {{ row.loserLogin }}</span>
        </template>
        <template #amount="{ row }">
          <span class="font-medium tabular-nums text-fg">{{ row.amount }}</span>
        </template>
      </DataTable>
    </PageSection>

    <PageSection v-else :title="$t('games.sections.history')">
      <DataTable
        :columns="historyColumns"
        :rows="store.gameHistory"
        :row-key="(row: LoyaltyGameHistoryEntry) => row.id"
        max-height="max-h-96"
      >
        <template #empty>
          <EmptyState :title="$t('games.history.empty')" />
        </template>
        <template #time="{ row }">
          <span class="text-xs text-fg-muted">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #user="{ row }">{{ row.userLogin }}</template>
        <template #result="{ row }">
          {{ row.reason === 'game_win' ? $t('games.history.won') : $t('games.history.lost') }}
        </template>
        <template #amount="{ row }">
          <span class="font-medium" :class="row.amount >= 0 ? 'text-success' : 'text-danger'">
            {{ row.amount >= 0 ? '+' : '' }}{{ row.amount }}
          </span>
        </template>
      </DataTable>
    </PageSection>

    <GameGeneralModal
      v-if="openModal === 'general'"
      :game="game"
      @close="openModal = null"
      @submit="saveGeneral"
    />
    <GameConfigModal
      v-if="openModal === 'config'"
      :game="game"
      @close="openModal = null"
      @submit="saveConfig"
    />
    <GameCommandsModal
      v-if="openModal === 'commands'"
      :game="game"
      @close="openModal = null"
      @submit="saveCommands"
    />
    <GameTextsModal
      v-if="openModal === 'texts'"
      :game="game"
      @close="openModal = null"
      @submit="saveTexts"
    />
  </div>
</template>
