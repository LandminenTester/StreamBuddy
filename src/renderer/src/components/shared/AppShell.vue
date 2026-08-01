<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Coins,
  Dices,
  Gauge,
  Gift,
  Info,
  MessageSquareText,
  Repeat2,
  Settings,
  Users,
  Vote,
  type LucideIcon
} from 'lucide-vue-next'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import { useChatStore } from '@renderer/stores/chat.store'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AboutModal from './AboutModal.vue'
import ThemeToggle from './ThemeToggle.vue'

interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
}

interface NavGroup {
  key: string
  items: NavItem[]
}

/**
 * Gruppierte Navigation. Die Gruppen tragen bewusst keine Ueberschrift -- sie
 * trennen nur ueber Abstand, passend zum randlosen Seitenlayout.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    items: [{ to: '/dashboard', labelKey: 'nav.dashboard', icon: Gauge }]
  },
  {
    key: 'chat',
    items: [
      { to: '/commands', labelKey: 'nav.commands', icon: MessageSquareText },
      { to: '/automessages', labelKey: 'nav.automessages', icon: Repeat2 },
      { to: '/polls', labelKey: 'nav.polls', icon: Vote }
    ]
  },
  {
    key: 'community',
    items: [
      { to: '/channel-points', labelKey: 'nav.channelPoints', icon: Gift },
      { to: '/loyalty', labelKey: 'nav.loyalty', icon: Coins },
      { to: '/games', labelKey: 'nav.games', icon: Dices },
      { to: '/audience', labelKey: 'nav.audience', icon: Users }
    ]
  },
  {
    key: 'system',
    items: [{ to: '/settings', labelKey: 'nav.settings', icon: Settings }]
  }
]

const { t } = useI18n()
const appInfoStore = useAppInfoStore()
const chatStore = useChatStore()
const isAboutOpen = ref(false)

let unsubscribeUpdateStatus: (() => void) | null = null
let unsubscribeChatStatus: (() => void) | null = null

onMounted(async () => {
  await Promise.all([
    appInfoStore.fetchVersion(),
    appInfoStore.fetchMetadata(),
    appInfoStore.fetchChangelog(),
    chatStore.fetchStatus()
  ])
  unsubscribeUpdateStatus = appInfoStore.subscribeToUpdateStatus()
  unsubscribeChatStatus = chatStore.subscribeToStatusChanges()
})

onUnmounted(() => {
  unsubscribeUpdateStatus?.()
  unsubscribeChatStatus?.()
})

const connectionLabel = computed(() =>
  chatStore.status.connected
    ? `#${chatStore.status.channel}`
    : t('settings.connection.disconnected')
)

const hasUpdateNotice = computed(() => {
  const s = appInfoStore.updateStatus.state
  return s === 'available' || s === 'downloading' || s === 'downloaded'
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface text-fg">
    <aside class="flex w-60 shrink-0 flex-col border-r border-line">
      <div class="px-5 pb-4 pt-5">
        <p class="text-base font-semibold tracking-tight text-fg">{{ $t('app.name') }}</p>
        <AppBadge
          class="mt-2"
          :variant="chatStore.status.connected ? 'success' : 'neutral'"
          dot
        >
          {{ connectionLabel }}
        </AppBadge>
      </div>

      <nav class="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-2">
        <div v-for="group in NAV_GROUPS" :key="group.key" class="space-y-0.5">
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-subtle hover:text-fg"
            active-class="bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent"
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            {{ $t(item.labelKey) }}
          </RouterLink>
        </div>
      </nav>

      <footer class="space-y-3 border-t border-line px-5 py-4">
        <ThemeToggle />
        <div class="flex items-center justify-between gap-2">
          <p class="truncate text-xs text-fg-subtle">v{{ appInfoStore.version }}</p>
          <button
            type="button"
            class="flex flex-col items-start text-xs font-medium transition-colors"
            :class="hasUpdateNotice ? 'text-accent' : 'text-fg-muted hover:text-fg'"
            @click="isAboutOpen = true"
          >
            <span class="inline-flex items-center gap-1">
              <Info class="h-3.5 w-3.5" />
              {{ $t('nav.about') }}
            </span>
            <span v-if="hasUpdateNotice" class="mt-0.5 pl-5 font-semibold">
              {{ $t('nav.updateAvailable') }}
            </span>
          </button>
        </div>
      </footer>
    </aside>

    <main class="custom-scrollbar flex-1 overflow-y-auto p-8">
      <slot />
    </main>

    <AboutModal v-if="isAboutOpen" @close="isAboutOpen = false" />
  </div>
</template>
