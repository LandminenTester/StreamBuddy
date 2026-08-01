<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStatsStore } from '@renderer/stores/stats.store'
import { useChatStore } from '@renderer/stores/chat.store'
import StatRow, { type StatItem } from '@renderer/components/ui/StatRow.vue'
import LineChart from '@renderer/components/shared/LineChart.vue'
import BarChart from '@renderer/components/shared/BarChart.vue'
import ChatFeedPanel from '@renderer/components/dashboard/ChatFeedPanel.vue'
import { initDashboard } from './functions'
import { messageBucketsToChartData, viewerSamplesToChartData } from './utils'

const { t } = useI18n()
const statsStore = useStatsStore()
const chatStore = useChatStore()

let unsubscribe: (() => void) | null = null
let unsubscribeChatFeed: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initDashboard(statsStore)
  unsubscribeChatFeed = chatStore.subscribeToMessages()
  await chatStore.fetchStatus()
})

onUnmounted(() => {
  unsubscribe?.()
  unsubscribeChatFeed?.()
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
