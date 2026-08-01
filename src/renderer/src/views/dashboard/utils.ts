import type { ChatMessageStatsBucket, ViewerCountSample } from '@shared/types/stats'
import { activeLocaleTag } from '@renderer/i18n'

function formatHourLabel(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString(activeLocaleTag(), {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function messageBucketsToChartData(buckets: ChatMessageStatsBucket[]): {
  labels: string[]
  values: number[]
} {
  return {
    labels: buckets.map((b) => formatHourLabel(b.bucketStart)),
    values: buckets.map((b) => b.messageCount)
  }
}

export function viewerSamplesToChartData(samples: ViewerCountSample[]): {
  labels: string[]
  values: number[]
} {
  return {
    labels: samples.map((s) => formatHourLabel(s.sampledAt)),
    values: samples.map((s) => s.viewerCount)
  }
}
