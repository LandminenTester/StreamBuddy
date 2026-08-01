<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import AboutModal from './AboutModal.vue'
import ThemeToggle from './ThemeToggle.vue'
import UpdateAvailableModal from './UpdateAvailableModal.vue'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/commands', label: 'Commands' },
  { to: '/automessages', label: 'Automessages' },
  { to: '/polls', label: 'Umfragen' },
  { to: '/channel-points', label: 'Kanalpunkte' },
  { to: '/loyalty', label: 'Loyalty' },
  { to: '/games', label: 'Games' },
  { to: '/settings', label: 'Einstellungen' }
]

const appInfoStore = useAppInfoStore()
const isAboutOpen = ref(false)
const isUpdateModalOpen = ref(false)
const dismissedUpdateVersion = ref<string | null>(null)

let unsubscribeUpdateStatus: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    appInfoStore.fetchVersion(),
    appInfoStore.fetchMetadata(),
    appInfoStore.fetchChangelog()
  ])
  unsubscribeUpdateStatus = appInfoStore.subscribeToUpdateStatus()
})

onUnmounted(() => {
  unsubscribeUpdateStatus?.()
})

watch(
  () => appInfoStore.updateStatus,
  (status) => {
    if (
      (status.state === 'available' || status.state === 'downloaded') &&
      status.version &&
      status.version !== dismissedUpdateVersion.value
    ) {
      isUpdateModalOpen.value = true
    }
  },
  { deep: true }
)

function closeUpdateModal(): void {
  dismissedUpdateVersion.value = appInfoStore.updateStatus.version ?? null
  isUpdateModalOpen.value = false
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <aside class="flex w-56 shrink-0 flex-col border-r border-slate-200 dark:border-neutral-800">
      <div class="px-4 py-5 text-lg font-semibold text-twitch-purple">Streaming Bot</div>
      <nav class="flex flex-1 flex-col gap-1 px-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-twitch-purple/10"
          active-class="bg-twitch-purple/10 text-twitch-purple dark:bg-twitch-purple/20"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <footer class="border-t border-slate-200 px-4 py-3 dark:border-neutral-800">
        <p class="text-xs text-slate-500 dark:text-neutral-400">Erstellt von Landminen Tester</p>
        <ThemeToggle class="mt-2" />
        <button
          type="button"
          class="mt-1 text-xs font-medium text-twitch-purple hover:underline"
          @click="isAboutOpen = true"
        >
          Über StreamerBot
        </button>
      </footer>
    </aside>
    <main class="flex-1 overflow-y-auto p-6">
      <slot />
    </main>

    <AboutModal v-if="isAboutOpen" @close="isAboutOpen = false" />
    <UpdateAvailableModal v-if="isUpdateModalOpen" @close="closeUpdateModal" />
  </div>
</template>
