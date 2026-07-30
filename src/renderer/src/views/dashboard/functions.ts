import type { useStatsStore } from '@renderer/stores/stats.store'

type StatsStore = ReturnType<typeof useStatsStore>

export async function initDashboard(store: StatsStore): Promise<() => void> {
  await Promise.all([store.fetchMessagesPerHour(), store.fetchViewerCountSeries()])
  return store.subscribeToLiveUpdates()
}
