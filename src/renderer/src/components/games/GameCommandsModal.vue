<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { commandKeyLabel } from '@renderer/views/games/commandMeta'

const props = defineProps<{ game: LoyaltyGameInfo; isSaving?: boolean; error?: string | null }>()
const emit = defineEmits<{ close: []; submit: [triggers: Record<string, string>] }>()

const draft = reactive<Record<string, string>>(
  Object.fromEntries(props.game.commands.map((command) => [command.key, command.trigger]))
)

/** Leere Felder fallen auf den Default-Trigger des Spiels zurueck. */
function submit(): void {
  const triggers: Record<string, string> = { ...props.game.commandTriggers }
  for (const command of props.game.commands) {
    const value = draft[command.key]?.trim()
    if (value) triggers[command.key] = value
    else delete triggers[command.key]
  }
  emit('submit', triggers)
}
</script>

<template>
  <BaseModal :title="$t('games.commands.edit')" @close="emit('close')">
    <div class="space-y-5">
      <AppInput
        v-for="command in game.commands"
        :key="command.key"
        v-model="draft[command.key]"
        :label="commandKeyLabel(command.key)"
        :placeholder="command.defaultTrigger"
      />
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :loading="isSaving" @click="submit">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
