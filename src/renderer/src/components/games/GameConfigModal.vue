<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { numericConfigEntries } from '@renderer/views/loyalty/utils'
import { fieldHint, fieldLabel, fieldMeta } from '@renderer/views/games/fieldMeta'

const props = defineProps<{ game: LoyaltyGameInfo }>()
const emit = defineEmits<{ close: []; submit: [config: Record<string, unknown>] }>()

const entries = numericConfigEntries(props.game.config)
// Eigener Entwurf statt v-model direkt auf dem Store-Objekt -- Abbrechen soll
// wirklich nichts veraendern.
const draft = reactive<Record<string, number>>(Object.fromEntries(entries))
</script>

<template>
  <BaseModal :title="$t('games.config.edit')" @close="emit('close')">
    <div class="space-y-5">
      <AppInput
        v-for="[key] in entries"
        :key="key"
        v-model="draft[key]"
        type="number"
        :label="fieldLabel(key)"
        :hint="fieldHint(key)"
        :min="fieldMeta(key)?.min"
        :max="fieldMeta(key)?.max"
      />
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...game.config, ...draft })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
