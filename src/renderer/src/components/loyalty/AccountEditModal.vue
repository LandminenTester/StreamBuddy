<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import type { AccountEditFormState } from '@renderer/views/loyalty/types'

const props = defineProps<{ initial: AccountEditFormState }>()
const emit = defineEmits<{ close: []; submit: [form: AccountEditFormState] }>()

const form = reactive<AccountEditFormState>({ ...props.initial })
</script>

<template>
  <BaseModal :title="`${$t('loyalty.editAccount')}: ${form.userLogin}`" @close="emit('close')">
    <AppInput
      v-model="form.balance"
      type="number"
      :min="0"
      :label="$t('loyalty.leaderboard.balance')"
      required
    />

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
