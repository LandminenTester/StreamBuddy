<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppTextarea from '@renderer/components/ui/AppTextarea.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import type { RewardFormState } from '@renderer/views/channelPoints/types'
import { actionTypeOptions } from '@renderer/views/channelPoints/utils'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'

const props = defineProps<{ initial: RewardFormState }>()
const emit = defineEmits<{ close: []; submit: [form: RewardFormState] }>()

const { t } = useI18n()
const form = reactive<RewardFormState>({ ...props.initial })
const commandsStore = useCommandsStore()
const alertsStore = useAlertsStore()

onMounted(() => {
  if (commandsStore.commands.length === 0) {
    void commandsStore.fetchCommands()
  }
  if (alertsStore.effects.length === 0) {
    void alertsStore.fetchEffects()
  }
})

const commandOptions = computed(() =>
  commandsStore.commands.map((command) => ({
    value: String(command.id),
    label: command.trigger
  }))
)

const selectedCommandId = computed({
  get: () => (form.actionCommandId === null ? '' : String(form.actionCommandId)),
  set: (value: string) => {
    form.actionCommandId = value ? Number(value) : null
  }
})

const effectOptions = computed(() =>
  alertsStore.effects.map((effect) => ({
    value: String(effect.id),
    label: effect.name
  }))
)

const selectedEffectId = computed({
  get: () => (form.actionEffectId === null ? '' : String(form.actionEffectId)),
  set: (value: string) => {
    form.actionEffectId = value ? Number(value) : null
  }
})

const exchangeModeOptions = computed<SelectOption[]>(() => [
  { value: 'rate', label: t('channelPoints.loyaltyExchange.modeRate') },
  { value: 'fixed', label: t('channelPoints.loyaltyExchange.modeFixed') }
])

const exchangePreview = computed<string>(() => {
  if (form.loyaltyExchangeMode === 'rate') {
    const pts = Math.floor(form.cost / (form.loyaltyExchangeValue || 1))
    return t('channelPoints.loyaltyExchange.previewRate', { cost: form.cost, value: form.loyaltyExchangeValue, pts })
  }
  return t('channelPoints.loyaltyExchange.previewFixed', { pts: form.loyaltyExchangeValue })
})
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('channelPoints.new') : $t('channelPoints.edit')"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <AppInput v-model="form.title" :label="$t('channelPoints.form.title')" required />

      <div class="grid gap-5 sm:grid-cols-2">
        <AppInput
          v-model="form.cost"
          type="number"
          :min="1"
          :label="$t('channelPoints.form.cost')"
        />
        <div>
          <label class="block text-xs font-medium text-fg-muted" for="reward-color">
            {{ $t('channelPoints.form.color') }}
          </label>
          <input
            id="reward-color"
            v-model="form.backgroundColor"
            type="color"
            class="mt-1.5 h-9 w-full cursor-pointer rounded-md border border-line-strong bg-surface p-1"
          />
        </div>
      </div>

      <AppTextarea
        v-model="form.prompt"
        :label="$t('channelPoints.form.prompt')"
        :rows="2"
      />

      <AppSelect
        v-model="form.actionType"
        :label="$t('channelPoints.form.actionType')"
        :options="actionTypeOptions()"
      />

      <AppTextarea
        v-if="form.actionType === 'chat_message'"
        v-model="form.actionMessage"
        :label="$t('channelPoints.form.actionMessage')"
        :rows="2"
      />

      <AppSelect
        v-if="form.actionType === 'trigger_command'"
        v-model="selectedCommandId"
        :label="$t('channelPoints.form.actionCommand')"
        :options="commandOptions"
      />

      <AppSelect
        v-if="form.actionType === 'trigger_effect'"
        v-model="selectedEffectId"
        :label="$t('channelPoints.form.actionEffect')"
        :options="effectOptions"
      />

      <template v-if="form.actionType === 'loyalty_exchange'">
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="form.loyaltyExchangeMode"
            :label="$t('channelPoints.loyaltyExchange.mode')"
            :options="exchangeModeOptions"
          />
          <AppInput
            v-model="form.loyaltyExchangeValue"
            type="number"
            :min="1"
            :label="form.loyaltyExchangeMode === 'rate'
              ? $t('channelPoints.loyaltyExchange.rateLabel')
              : $t('channelPoints.loyaltyExchange.fixedLabel')"
          />
        </div>
        <p class="text-xs text-fg-muted">{{ exchangePreview }}</p>
      </template>

      <div class="space-y-4">
        <AppToggle v-model="form.isEnabled" :label="$t('channelPoints.form.isEnabled')" />
        <AppToggle v-model="form.autoFulfill" :label="$t('channelPoints.form.autoFulfill')" />
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
