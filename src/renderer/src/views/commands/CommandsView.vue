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
  { key: 'custom', label: t('commands.tabs.custom') },
  { key: 'builtin', label: t('commands.tabs.builtin') }
])

const activeTab = computed(() => (route.name as string)?.replace('commands-', '') ?? 'custom')

function selectTab(key: string): void {
  void router.replace({ name: `commands-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <PageHeader :title="$t('commands.title')" :description="$t('commands.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
