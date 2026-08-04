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
  { key: 'settings', label: t('greetings.tabs.settings') },
  { key: 'blacklist', label: t('greetings.tabs.blacklist') }
])

const activeTab = computed(
  () => (route.name as string)?.replace('greetings-', '') ?? 'settings'
)

function selectTab(key: string): void {
  void router.replace({ name: `greetings-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader :title="$t('loyalty.greetings.title')" :description="$t('loyalty.greetings.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
