<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useStatsStore } from '@renderer/stores/stats.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'
import StatsCard from '@renderer/components/shared/StatsCard.vue'
import LineChart from '@renderer/components/shared/LineChart.vue'
import BarChart from '@renderer/components/shared/BarChart.vue'
import { initDashboard } from './functions'
import { messageBucketsToChartData, viewerSamplesToChartData } from './utils'

const statsStore = useStatsStore()
const authStore = useAuthStore()
const chatStore = useChatStore()

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initDashboard(statsStore)
  await Promise.all([authStore.fetchStatus(), chatStore.fetchStatus()])
})

onUnmounted(() => {
  unsubscribe?.()
})

const messageChart = computed(() => messageBucketsToChartData(statsStore.messageBuckets))
const viewerChart = computed(() => viewerSamplesToChartData(statsStore.viewerSamples))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Stats-Übersicht und Bot-Status.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatsCard
        label="Bot-Verbindung"
        :value="
          authStore.status.connected ? (authStore.status.twitchLogin ?? 'Verbunden') : 'Getrennt'
        "
      />
      <StatsCard
        label="Chat"
        :value="chatStore.status.connected ? `#${chatStore.status.channel}` : 'Nicht verbunden'"
      />
      <StatsCard
        label="Aktueller Viewer-Count"
        :value="statsStore.live.currentViewerCount?.toString() ?? '–'"
      />
    </div>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Viewer-Count (24h)
      </h2>
      <div class="mt-3">
        <LineChart :labels="viewerChart.labels" :values="viewerChart.values" label="Viewer" />
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Messages pro Stunde (24h)
      </h2>
      <div class="mt-3">
        <BarChart :labels="messageChart.labels" :values="messageChart.values" label="Nachrichten" />
      </div>
    </section>
  </div>
</template>
