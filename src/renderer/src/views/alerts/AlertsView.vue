<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppTabs, { type TabDefinition } from '@renderer/components/ui/AppTabs.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tabs = computed<TabDefinition[]>(() => [
  { key: 'effects', label: t('alerts.tabs.effects') },
  { key: 'manager', label: t('alerts.tabs.manager') }
])

const activeTab = computed(() => (route.name as string)?.replace('alerts-', '') ?? 'effects')

function selectTab(key: string): void {
  void router.replace({ name: `alerts-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader :title="$t('alerts.title')" :description="$t('alerts.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
