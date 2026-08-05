<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import { gameLabel } from '@renderer/views/loyalty/utils'
import type { BuiltInCommandInfo } from '@shared/types/command'

const { t } = useI18n()
const store = useCommandsStore()

onMounted(() => {
  void store.fetchBuiltInCommands()
})

const loyaltyCommands = computed(() =>
  store.builtInCommands.filter((command) => command.scope === 'loyalty')
)
const gameCommands = computed(() =>
  store.builtInCommands.filter((command) => command.scope === 'game')
)

function loyaltyLabel(key: string): string {
  return t(`commands.builtin.loyalty.${key}`)
}

function gameGroupLabel(gameId: string): string {
  return gameLabel(gameId)
}

async function toggle(command: BuiltInCommandInfo, enabled: boolean): Promise<void> {
  await store.setBuiltInEnabled(command.key, enabled)
}
</script>

<template>
  <div class="space-y-8">
    <PageSection :title="$t('commands.builtin.loyaltyTitle')" :divided="false">
      <ul class="divide-y divide-line border-t border-line">
        <li
          v-for="command in loyaltyCommands"
          :key="command.key"
          class="flex items-center justify-between gap-4 py-2.5 text-sm"
        >
          <div class="min-w-0">
            <p class="text-fg">{{ loyaltyLabel(command.key) }}</p>
            <p class="mt-0.5 truncate font-mono text-xs text-fg-subtle">
              {{ command.triggers.join('  ') }}
            </p>
          </div>
          <AppToggle
            :model-value="command.enabled"
            @update:model-value="(value) => toggle(command, value)"
          />
        </li>
      </ul>
    </PageSection>

    <PageSection :title="$t('commands.builtin.gamesTitle')">
      <ul class="divide-y divide-line border-t border-line">
        <li
          v-for="command in gameCommands"
          :key="command.key"
          class="flex items-center justify-between gap-4 py-2.5 text-sm"
        >
          <div class="min-w-0">
            <p class="text-fg">
              {{ gameGroupLabel(command.gameId!) }}
              <span class="text-fg-subtle">— {{ command.key.split('.')[1] }}</span>
            </p>
            <p class="mt-0.5 truncate font-mono text-xs text-fg-subtle">
              {{ command.triggers.join('  ') }}
            </p>
          </div>
          <AppBadge v-if="command.temporarilyUnavailable" variant="warning" dot>
            {{ $t('games.general.temporarilyUnavailableShort') }}
          </AppBadge>
          <AppToggle
            v-else
            :model-value="command.enabled"
            @update:model-value="(value) => toggle(command, value)"
          />
        </li>
      </ul>
    </PageSection>
  </div>
</template>
