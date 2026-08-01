<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import AppTabs, { type TabDefinition } from '@renderer/components/ui/AppTabs.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'
import { initSettings } from './functions'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initSettings(authStore, chatStore)
})

onUnmounted(() => {
  unsubscribe?.()
})

const tabs = computed<TabDefinition[]>(() => [
  { key: 'general', label: t('settings.tabs.general') },
  { key: 'connection', label: t('settings.tabs.connection') },
  { key: 'features', label: t('settings.tabs.features') }
])

/** Der aktive Tab ist die Unterroute -- so bleibt er ueber Navigation hinweg erhalten. */
const activeTab = computed(() => (route.name as string)?.replace('settings-', '') ?? 'general')

function selectTab(key: string): void {
  void router.replace({ name: `settings-${key}` })
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <PageHeader :title="$t('settings.title')" :description="$t('settings.description')" />
    <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />
    <RouterView />
  </div>
</template>
