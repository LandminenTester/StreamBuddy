<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppTabs, { type TabDefinition } from '@renderer/components/ui/AppTabs.vue'
import { useAutomessagesStore } from '@renderer/stores/automessages.store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useAutomessagesStore()

onMounted(() => {
  void store.fetchAutomessages()
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'messages', label: t('automessages.tabs.messages') },
  {
    key: 'ad-message',
    label: t('automessages.tabs.adMessage'),
    disabled: true,
    disabledReason: t('automessages.ad.warning')
  }
])

const activeTab = computed(() => (route.name as string)?.replace('automessages-', '') ?? 'messages')

function selectTab(key: string): void {
  const tab = tabs.value.find((entry) => entry.key === key)
  if (tab?.disabled) return
  void router.replace({ name: `automessages-${key}` })
}

// Der Werbungsnachricht-Tab ist gesperrt -- direkte Navigation (z.B. via URL) umleiten.
watch(
  () => route.name,
  (name) => {
    if (name === 'automessages-ad-message') {
      void router.replace({ name: 'automessages-messages' })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader :title="$t('automessages.title')" :description="$t('automessages.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
