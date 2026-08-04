<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import UserSearchDropdown from '@renderer/components/shared/UserSearchDropdown.vue'
import PlaceholderHint from '@renderer/components/shared/PlaceholderHint.vue'
import type { LoyaltyPersonalGreeting } from '@shared/types/loyalty'

const props = defineProps<{
  initial: LoyaltyPersonalGreeting
  userLoginOptions: string[]
}>()
const emit = defineEmits<{ close: []; submit: [rule: LoyaltyPersonalGreeting] }>()

const { t } = useI18n()

const form = reactive<LoyaltyPersonalGreeting>({
  id: props.initial.id,
  userLogin: props.initial.userLogin,
  enabled: props.initial.enabled,
  texts: props.initial.texts.length > 0 ? [...props.initial.texts] : ['']
})

const isCreate = computed(() => props.initial.userLogin.trim().length === 0)
const canSave = computed(() => form.userLogin.trim().length > 0)

function submit(): void {
  if (!canSave.value) return
  emit('submit', { ...form, userLogin: form.userLogin.trim().replace(/^@/, '').toLowerCase() })
}
</script>

<template>
  <BaseModal
    :title="
      isCreate
        ? t('greetings.editModal.createTitle')
        : t('greetings.editModal.editTitle', { user: form.userLogin })
    "
    @close="emit('close')"
  >
    <div class="space-y-4">
      <UserSearchDropdown
        v-model="form.userLogin"
        :suggestions="userLoginOptions"
        :label="$t('loyalty.greetings.userLogin')"
        :placeholder="$t('loyalty.greetings.userPlaceholder')"
      />
      <AppToggle v-model="form.enabled" :label="$t('common.enabled')" />
      <div>
        <p class="mb-2 text-xs font-medium uppercase text-fg-subtle">
          {{ $t('loyalty.greetings.personalTexts') }}
        </p>
        <p class="mb-2 text-xs text-fg-muted">
          {{ $t('loyalty.greetings.personalTextsHint') }}
        </p>
        <StringListInput
          v-model="form.texts"
          :placeholder="$t('loyalty.greetings.personalTextPlaceholder')"
        />
        <PlaceholderHint class="mt-3" />
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :disabled="!canSave" @click="submit">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
