<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { AutomessageFormState } from '@renderer/views/automessages/types'
import { modeOptions } from '@renderer/views/automessages/utils'

const props = defineProps<{ initial: AutomessageFormState }>()
const emit = defineEmits<{ close: []; submit: [form: AutomessageFormState] }>()

const form = reactive<AutomessageFormState>({
  ...props.initial,
  messages: [...props.initial.messages]
})
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('automessages.new') : $t('automessages.edit')"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <div>
        <p class="mb-1 text-xs font-medium text-fg-muted">{{ $t('automessages.form.messages') }}</p>
        <StringListInput v-model="form.messages" />
        <p class="mt-1.5 text-xs text-fg-subtle">{{ $t('automessages.form.messagesHint') }}</p>
      </div>

      <AppSelect
        v-model="form.mode"
        :label="$t('automessages.form.mode')"
        :options="modeOptions()"
      />

      <AppInput
        v-if="form.mode === 'interval'"
        v-model="form.intervalMinutes"
        type="number"
        :min="1"
        :label="$t('automessages.form.intervalMinutes')"
      />
      <AppInput
        v-else
        v-model="form.messageCountThreshold"
        type="number"
        :min="1"
        :label="$t('automessages.form.messageCountThreshold')"
      />

      <AppInput
        v-model="form.minChatLinesSinceLast"
        type="number"
        :min="0"
        :label="$t('automessages.form.minChatLines')"
      />

      <AppToggle v-model="form.enabled" :label="$t('automessages.form.enabled')" />
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
