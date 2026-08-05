<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { gameLabel } from '@renderer/views/loyalty/utils'
import { isGameTemporarilyUnavailable } from '@shared/temporarilyUnavailable'

const props = defineProps<{ game: LoyaltyGameInfo }>()
const emit = defineEmits<{
  close: []
  submit: [payload: { displayName: string; enabled: boolean }]
}>()

const displayName = ref(props.game.displayName ?? '')
const enabled = ref(props.game.enabled)
const unavailable = isGameTemporarilyUnavailable(props.game.gameId)
</script>

<template>
  <BaseModal :title="$t('games.general.edit')" @close="emit('close')">
    <div class="space-y-6">
      <AppInput
        v-model="displayName"
        :label="$t('games.general.displayName')"
        :placeholder="gameLabel(game.gameId)"
        :hint="$t('games.general.displayNameHint')"
      />
      <AppToggle v-model="enabled" :disabled="unavailable" :label="$t('games.general.state')" />
      <p v-if="unavailable" class="-mt-4 text-xs text-warning">
        {{ $t('games.general.temporarilyUnavailable') }}
      </p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton
        variant="primary"
        :disabled="unavailable"
        @click="emit('submit', { displayName: displayName.trim(), enabled })"
      >
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
