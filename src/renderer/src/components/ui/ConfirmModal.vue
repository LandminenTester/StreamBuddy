<script setup lang="ts">
import AppButton from './AppButton.vue'
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    variant?: 'primary' | 'danger'
  }>(),
  { cancelLabel: undefined, variant: 'primary' }
)

defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <BaseModal :title="title" max-width="max-w-md" @close="$emit('close')">
    <p class="text-sm leading-6 text-fg-muted">{{ message }}</p>

    <template #footer>
      <AppButton variant="ghost" @click="$emit('close')">
        {{ cancelLabel ?? $t('common.cancel') }}
      </AppButton>
      <AppButton :variant="variant" @click="$emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </BaseModal>
</template>
