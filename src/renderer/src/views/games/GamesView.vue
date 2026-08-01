<script setup lang="ts">
import { onMounted } from 'vue'
import { ChevronRight, Dices } from 'lucide-vue-next'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { gameDisplayName } from '@renderer/views/loyalty/utils'

const store = useLoyaltyStore()

onMounted(() => {
  void store.fetchGames()
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <PageHeader :title="$t('games.title')" :description="$t('games.description')" />

    <EmptyState v-if="store.games.length === 0" :title="$t('games.overviewEmpty')">
      <template #icon><Dices class="h-8 w-8" /></template>
    </EmptyState>

    <!-- Eine Zeile pro Spiel, getrennt nur durch Haarlinien. -->
    <div v-else class="divide-y divide-line border-t border-line">
      <RouterLink
        v-for="game in store.games"
        :key="game.gameId"
        :to="{ name: 'game-detail', params: { gameId: game.gameId } }"
        class="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface-subtle"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-fg">{{ gameDisplayName(game) }}</p>
          <p class="mt-0.5 truncate font-mono text-xs text-fg-subtle">
            {{ game.commands.map((command) => command.trigger).join('  ') }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <AppBadge :variant="game.enabled ? 'success' : 'neutral'" dot>
            {{ game.enabled ? $t('common.enabled') : $t('common.disabled') }}
          </AppBadge>
          <ChevronRight class="h-4 w-4 text-fg-subtle" />
        </div>
      </RouterLink>
    </div>
  </div>
</template>
