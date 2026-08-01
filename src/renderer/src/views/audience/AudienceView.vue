<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppTabs, { type TabDefinition } from '@renderer/components/ui/AppTabs.vue'
import { useFollowersStore } from '@renderer/stores/followers.store'
import { useViewersStore } from '@renderer/stores/viewers.store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const followersStore = useFollowersStore()
const viewersStore = useViewersStore()

let unsubscribeSync: (() => void) | null = null
let unsubscribePresence: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    followersStore.fetchAll(),
    followersStore.fetchSyncStatus(),
    viewersStore.fetchStreams()
  ])
  unsubscribeSync = followersStore.subscribeToSyncComplete()
  unsubscribePresence = viewersStore.subscribeToPresenceUpdates()
})

onUnmounted(() => {
  unsubscribeSync?.()
  unsubscribePresence?.()
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'followers', label: t('audience.tabs.followers') },
  { key: 'archive', label: t('audience.tabs.archive') }
])

const activeTab = computed(() => (route.name as string)?.replace('audience-', '') ?? 'followers')

function selectTab(key: string): void {
  void router.replace({ name: `audience-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <PageHeader :title="$t('audience.title')" :description="$t('audience.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
