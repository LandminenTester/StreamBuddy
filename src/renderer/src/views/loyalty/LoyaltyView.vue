<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppTabs, { type TabDefinition } from '@renderer/components/ui/AppTabs.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useLoyaltyStore()

onMounted(() => {
  void store.fetchLeaderboard()
  void store.fetchEarnRules()
  void store.fetchBlacklist()
  void store.fetchOfflineMessages()
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'leaderboard', label: t('loyalty.tabs.leaderboard') },
  { key: 'blacklist', label: t('loyalty.tabs.blacklist') },
  { key: 'earn-rules', label: t('loyalty.tabs.earnRules') },
  { key: 'offline-messages', label: t('loyalty.tabs.offlineMessages') }
])

const activeTab = computed(() => (route.name as string)?.replace('loyalty-', '') ?? 'leaderboard')

function selectTab(key: string): void {
  void router.replace({ name: `loyalty-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <PageHeader :title="$t('loyalty.title')" :description="$t('loyalty.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
