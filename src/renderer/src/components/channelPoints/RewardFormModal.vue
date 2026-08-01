<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppTextarea from '@renderer/components/ui/AppTextarea.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import type { RewardFormState } from '@renderer/views/channelPoints/types'
import { actionTypeOptions } from '@renderer/views/channelPoints/utils'

const props = defineProps<{ initial: RewardFormState }>()
const emit = defineEmits<{ close: []; submit: [form: RewardFormState] }>()

const form = reactive<RewardFormState>({ ...props.initial })
const commandsStore = useCommandsStore()

onMounted(() => {
  if (commandsStore.commands.length === 0) {
    void commandsStore.fetchCommands()
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
