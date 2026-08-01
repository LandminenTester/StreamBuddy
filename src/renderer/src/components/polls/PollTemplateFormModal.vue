<script setup lang="ts">
import { computed, reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { PollTemplateFormState } from '@renderer/views/polls/types'

const props = defineProps<{ initial: PollTemplateFormState }>()
const emit = defineEmits<{ close: []; submit: [form: PollTemplateFormState] }>()

const form = reactive<PollTemplateFormState>({
  ...props.initial,
  choices: [...props.initial.choices]
})

const hasEnoughChoices = computed(
  () => form.choices.filter((choice) => choice.trim().length > 0).length >= 2
)
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('polls.templates.new') : $t('polls.templates.edit')"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <AppInput v-model="form.title" :label="$t('polls.create.titleLabel')" required />

      <div>
        <p class="mb-1 text-xs font-medium text-fg-muted">{{ $t('polls.create.choices') }}</p>
        <StringListInput v-model="form.choices" />
        <p class="mt-1.5 text-xs text-fg-subtle">{{ $t('polls.choicesHint') }}</p>
      </div>

      <AppInput
        v-model="form.durationSeconds"
        type="number"
        :min="15"
        :max="1800"
        :label="$t('polls.create.duration')"
      />

      <AppToggle
        v-model="form.channelPointsVotingEnabled"
        :label="$t('polls.create.channelPoints')"
      />

      <AppInput
        v-if="form.channelPointsVotingEnabled"
        v-model="form.channelPointsPerVote"
        type="number"
        :min="1"
        :label="$t('polls.create.channelPointsCost')"
      />
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :disabled="!hasEnoughChoices" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
