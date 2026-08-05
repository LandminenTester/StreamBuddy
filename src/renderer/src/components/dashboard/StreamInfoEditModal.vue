<script setup lang="ts">
import { reactive } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import UserSearchDropdown from '@renderer/components/shared/UserSearchDropdown.vue'

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

async function searchCategories(query: string): Promise<string[]> {
  if (!query.trim()) return []
  const results = await window.api.invoke('stream:searchCategories', { query })
  return results.map((category) => category.name)
}
</script>

<template>
  <BaseModal
    :title="$t('dashboard.streamInfo.editTitle')"
    max-width="max-w-2xl"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <AppInput
        v-model="form.title"
        :label="$t('dashboard.streamInfo.streamTitleLabel')"
        :placeholder="$t('dashboard.streamInfo.streamTitlePlaceholder')"
      />
      <UserSearchDropdown
        v-model="form.gameName"
        :search="searchCategories"
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
