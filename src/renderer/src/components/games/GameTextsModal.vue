<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { gameTextSlots, resolvedTextVariants, textSlotLabel } from '@renderer/views/loyalty/utils'

const props = defineProps<{ game: LoyaltyGameInfo }>()
const emit = defineEmits<{ close: []; submit: [texts: Record<string, string[]>] }>()

const slots = gameTextSlots(props.game)
const draft = reactive<Record<string, string[]>>(
  Object.fromEntries(slots.map((slot) => [slot, [...resolvedTextVariants(props.game, slot)]]))
)

/**
 * Alle Slots werden gemeinsam gespeichert -- vorher hatte jeder Slot einen eigenen
 * Speichern-Button, waehrend die uebrigen Felder automatisch speicherten.
 */
function submit(): void {
  const texts: Record<string, string[]> = { ...props.game.texts }
  for (const slot of slots) {
    texts[slot] = (draft[slot] ?? []).map((line) => line.trim()).filter((line) => line.length > 0)
  }
  emit('submit', texts)
}
</script>

<template>
  <BaseModal :title="$t('games.texts.edit')" max-width="max-w-2xl" @close="emit('close')">
    <p class="text-xs text-fg-muted">{{ $t('games.texts.hint') }}</p>

    <div class="mt-5 space-y-6">
      <div v-for="slot in slots" :key="slot">
        <p class="mb-2 text-xs font-medium text-fg-muted">{{ textSlotLabel(slot) }}</p>
        <StringListInput v-model="draft[slot]" />
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="submit">{{ $t('common.save') }}</AppButton>
    </template>
  </BaseModal>
</template>
