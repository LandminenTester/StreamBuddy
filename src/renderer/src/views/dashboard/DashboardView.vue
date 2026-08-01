<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatsStore } from '@renderer/stores/stats.store'
import { useChatStore } from '@renderer/stores/chat.store'
import { useFollowersStore } from '@renderer/stores/followers.store'
import { useViewersStore } from '@renderer/stores/viewers.store'
import StatRow, { type StatItem } from '@renderer/components/ui/StatRow.vue'
import LineChart from '@renderer/components/shared/LineChart.vue'
import BarChart from '@renderer/components/shared/BarChart.vue'
import ChatFeedPanel from '@renderer/components/dashboard/ChatFeedPanel.vue'
import { initDashboard } from './functions'
import { messageBucketsToChartData, viewerSamplesToChartData } from './utils'

const { t } = useI18n()
const statsStore = useStatsStore()
const chatStore = useChatStore()
const followersStore = useFollowersStore()
const viewersStore = useViewersStore()

let unsubscribe: (() => void) | null = null
let unsubscribeChatFeed: (() => void) | null = null
let unsubscribeSync: (() => void) | null = null
let unsubscribePresence: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initDashboard(statsStore)
  unsubscribeChatFeed = chatStore.subscribeToMessages()
  unsubscribeSync = followersStore.subscribeToSyncComplete()
  unsubscribePresence = viewersStore.subscribeToPresenceUpdates()
  await Promise.all([
    chatStore.fetchStatus(),
    followersStore.fetchSyncStatus(),
    viewersStore.fetchPresent()
  ])
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribeChatFeed?.()
  unsubscribeSync?.()
  unsubscribePresence?.()
})

const messageChart = computed(() => messageBucketsToChartData(statsStore.messageBuckets))
const viewerChart = computed(() => viewerSamplesToChartData(statsStore.viewerSamples))

const stats = computed<StatItem[]>(() => [
  {
    key: 'viewers',
    label: t('dashboard.stats.viewers'),
    value: statsStore.live.currentViewerCount?.toString() ?? '–'
  },
  {
    key: 'messages',
    label: t('dashboard.stats.messagesLastHour'),
    value: statsStore.live.messagesLastHour?.toString() ?? '–'
  },
  {
    key: 'stream',
    label: t('dashboard.stats.streamState'),
    value: statsStore.live.isLive ? t('dashboard.live') : t('dashboard.offline')
  },
  {
    key: 'followers',
    label: t('dashboard.stats.followers'),
    value: followersStore.syncStatus.totalCount > 0
      ? followersStore.syncStatus.totalCount.toString()
      : '–'
  }
])
</script>

<template>
  <!--
    Zwei Spalten in voller Hoehe: links Kennzahlen und Verlaeufe, rechts der Chat
    ueber die gesamte Spaltenhoehe, weil dort am meisten Inhalt anfaellt.
  -->
  <div class="flex h-full min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
    <div class="custom-scrollbar flex min-h-0 flex-col gap-8 overflow-y-auto pr-1">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-fg">{{ $t('dashboard.title') }}</h1>
        <p class="mt-1 text-sm text-fg-muted">{{ $t('dashboard.description') }}</p>
      </div>

      <StatRow :items="stats">
        <template #stream="{ item }">
          <span :class="statsStore.live.isLive ? 'text-success' : 'text-fg-muted'">
            {{ item.value }}
          </span>
        </template>
      </StatRow>

      <!-- Aktuelle Chat-Zuschauer -->
      <section class="border-t border-line pt-6">
        <h2 class="mb-3 text-base font-semibold text-fg">{{ $t('dashboard.viewers.title') }}</h2>
        <p v-if="viewersStore.presentUsers.length === 0" class="text-sm text-fg-muted">
          {{ statsStore.live.isLive ? $t('dashboard.viewers.empty') : $t('dashboard.viewers.emptyOffline') }}
        </p>
        <div v-else class="flex flex-wrap gap-1.5">
          <span
            v-for="user in viewersStore.presentUsers"
            :key="user"
            class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-fg"
          >
            {{ user }}
          </span>
        </div>
      </section>

      <section class="border-t border-line pt-6">
        <h2 class="text-base font-semibold text-fg">{{ $t('dashboard.charts.viewers') }}</h2>
        <div class="mt-4">
          <LineChart
            :labels="viewerChart.labels"
            :values="viewerChart.values"
            :label="$t('dashboard.charts.viewersSeries')"
          />
        </div>
      </section>

      <section class="border-t border-line pt-6">
        <h2 class="text-base font-semibold text-fg">{{ $t('dashboard.charts.messages') }}</h2>
        <div class="mt-4">
          <BarChart
            :labels="messageChart.labels"
            :values="messageChart.values"
            :label="$t('dashboard.charts.messagesSeries')"
          />
        </div>
      </section>
    </div>

    <div class="h-80 min-h-0 lg:h-full">
      <ChatFeedPanel />
    </div>
  </div>
</template>
