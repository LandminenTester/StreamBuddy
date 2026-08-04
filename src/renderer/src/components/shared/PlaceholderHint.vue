<script setup lang="ts">
import { computed } from 'vue'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'

const props = withDefaults(
  defineProps<{
    /** Spiel, dessen Befehls-Platzhalter zusaetzlich aufgelistet werden. */
    game?: LoyaltyGameInfo | null
  }>(),
  { game: null }
)

interface PlaceholderRow {
  token: string
  resolvesTo: string
}

const rows = computed<PlaceholderRow[]>(() => {
  const entries: PlaceholderRow[] = []
  if (props.game) {
    for (const command of props.game.commands) {
      entries.push({ token: `{cmd:${props.game.gameId}.${command.key}}`, resolvesTo: command.trigger })
    }
  }
  return entries
})
</script>

<template>
  <div class="text-xs leading-5 text-fg-muted">
    <p>{{ $t('placeholders.intro') }}</p>
    <dl class="mt-2 space-y-1">
      <div class="flex flex-wrap items-baseline gap-x-2">
        <dt><code class="font-mono text-accent">{pointname}</code></dt>
        <dd class="text-fg-subtle">{{ $t('placeholders.pointName') }}</dd>
      </div>
      <div v-for="row in rows" :key="row.token" class="flex flex-wrap items-baseline gap-x-2">
        <dt><code class="font-mono text-accent">{{ row.token }}</code></dt>
        <dd class="text-fg-subtle">
          {{ $t('placeholders.command', { trigger: row.resolvesTo }) }}
        </dd>
      </div>
      <div v-if="!game" class="flex flex-wrap items-baseline gap-x-2">
        <dt><code class="font-mono text-accent">{cmd:roulette.red}</code></dt>
        <dd class="text-fg-subtle">{{ $t('placeholders.commandExample') }}</dd>
      </div>
    </dl>
    <p v-if="!game" class="mt-2">{{ $t('placeholders.commandGeneric') }}</p>
  </div>
</template>
