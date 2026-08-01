<script setup lang="ts">
import { computed, onMounted } from 'vue'
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
  { key: 'ad-message', label: t('automessages.tabs.adMessage') }
])

const activeTab = computed(() => (route.name as string)?.replace('automessages-', '') ?? 'messages')

function selectTab(key: string): void {
  void router.replace({ name: `automessages-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader :title="$t('automessages.title')" :description="$t('automessages.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
