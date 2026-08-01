<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppTextarea from '@renderer/components/ui/AppTextarea.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import type { CommandFormState } from '@renderer/views/commands/types'
import { deliveryModeOptions, permissionOptions } from '@renderer/views/commands/utils'

const props = defineProps<{ initial: CommandFormState }>()
const emit = defineEmits<{ close: []; submit: [form: CommandFormState] }>()

const form = reactive<CommandFormState>({ ...props.initial })
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('commands.new') : $t('commands.edit')"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <AppInput
        v-model="form.trigger"
        :label="$t('commands.form.trigger')"
        :hint="$t('commands.form.triggerHint')"
        placeholder="!uptime"
        required
      />

      <AppTextarea
        v-model="form.response"
        :label="$t('commands.form.response')"
        :rows="3"
        required
      />

      <AppInput
        v-model="form.aliasesInput"
        :label="$t('commands.form.aliases')"
        :hint="$t('commands.form.aliasesHint')"
        placeholder="!time, !howlong"
      />

      <div class="grid gap-5 sm:grid-cols-2">
        <AppSelect
          v-model="form.permissionLevel"
          :label="$t('commands.form.permission')"
          :options="permissionOptions()"
        />
        <AppInput
          v-model="form.cooldownSeconds"
          type="number"
          :min="0"
          :label="$t('commands.form.cooldown')"
        />
      </div>

      <AppSelect
        v-model="form.deliveryMode"
        :label="$t('commands.form.delivery')"
        :options="deliveryModeOptions()"
        :hint="form.deliveryMode === 'whisper' ? $t('commands.form.whisperWarning') : undefined"
      />

      <AppToggle v-model="form.enabled" :label="$t('commands.form.enabled')" />
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
