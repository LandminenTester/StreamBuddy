<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'

const props = defineProps<{
  initialTitle: string
  initialGameName: string
  isSaving?: boolean
  error?: string | null
}>()
const emit = defineEmits<{
  close: []
  submit: [payload: { title: string; gameName: string }]
}>()

const form = reactive({ title: props.initialTitle, gameName: props.initialGameName })
</script>

<template>
  <BaseModal :title="$t('dashboard.streamInfo.editTitle')" @close="emit('close')">
    <div class="space-y-4">
      <AppInput
        v-model="form.title"
        :label="$t('dashboard.streamInfo.streamTitleLabel')"
        :placeholder="$t('dashboard.streamInfo.streamTitlePlaceholder')"
      />
      <AppInput
        v-model="form.gameName"
        :label="$t('dashboard.streamInfo.gameLabel')"
        :placeholder="$t('dashboard.streamInfo.gamePlaceholder')"
      />
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :loading="isSaving" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
