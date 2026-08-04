<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import PlaceholderHint from '@renderer/components/shared/PlaceholderHint.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { saveOfflineMessages } from '../functions'

const store = useLoyaltyStore()
const draft = ref<string[]>([])

watch(
  () => store.offlineMessages,
  (messages) => {
    draft.value = [...messages]
  },
  { immediate: true }
)
</script>

<template>
  <PageSection
    :title="$t('loyalty.offlineMessages.title')"
    :description="$t('loyalty.offlineMessages.description')"
    :divided="false"
  >
    <StringListInput v-model="draft" />
    <PlaceholderHint class="mt-4" />
    <AppButton class="mt-4" variant="primary" @click="saveOfflineMessages(store, draft)">
      {{ $t('common.save') }}
    </AppButton>
  </PageSection>
</template>
