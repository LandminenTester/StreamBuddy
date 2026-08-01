<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tv2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import { useViewersStore } from '@renderer/stores/viewers.store'

const { t, d } = useI18n()
const store = useViewersStore()

const expandedStreamId = ref<string | null>(null)

async function toggleStream(streamId: string): Promise<void> {
  if (expandedStreamId.value === streamId) {
    expandedStreamId.value = null
    return
  }
  expandedStreamId.value = streamId
  await store.fetchStreamViewers(streamId)
}

function formatDate(ts: number): string {
  return d(new Date(ts * 1000), 'short')
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return t('audience.archive.ongoing')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatViewDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const m = Math.floor(seconds / 60)
  return `${m} min`
}

const currentStats = computed(() => store.selectedStreamStats)
</script>

<template>
  <PageSection :title="$t('audience.archive.title')" :divided="false">
    <EmptyState
      v-if="store.streams.length === 0"
      :title="$t('audience.archive.empty')"
      :description="$t('audience.archive.emptyHint')"
    >
      <template #icon><Tv2 class="h-8 w-8" /></template>
    </EmptyState>

    <div v-else class="space-y-1">
      <div
        v-for="stream in store.streams"
        :key="stream.streamId"
        class="rounded-lg border border-line"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-subtle"
          @click="toggleStream(stream.streamId)"
        >
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-medium text-fg">{{ formatDate(stream.startedAt) }}</span>
              <AppBadge v-if="stream.gameName" variant="neutral" class="shrink-0">
                {{ stream.gameName }}
              </AppBadge>
              <AppBadge v-if="!stream.endedAt" variant="success" dot class="shrink-0">
                {{ $t('audience.archive.live') }}
              </AppBadge>
            </div>
            <p v-if="stream.streamTitle" class="truncate text-xs text-fg-muted">
              {{ stream.streamTitle }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-4 text-xs text-fg-muted">
            <span>{{ $t('audience.archive.columns.duration') }}: {{ formatDuration(stream.durationSeconds) }}</span>
            <span>{{ $t('audience.archive.columns.peakViewers') }}: {{ stream.peakViewerCount }}</span>
            <span>{{ $t('audience.archive.columns.uniqueChatters') }}: {{ stream.uniqueChatters }}</span>
            <component :is="expandedStreamId === stream.streamId ? ChevronUp : ChevronDown" class="h-4 w-4" />
          </div>
        </button>

        <div v-if="expandedStreamId === stream.streamId" class="border-t border-line px-4 pb-4 pt-3">
          <div v-if="currentStats" class="mb-3 flex flex-wrap gap-4 text-xs text-fg-muted">
            <span>{{ $t('audience.archive.stats.uniqueChatters') }}: <strong class="text-fg">{{ currentStats.uniqueChatters }}</strong></span>
            <span>{{ $t('audience.archive.stats.avgDuration') }}: <strong class="text-fg">{{ formatViewDuration(currentStats.avgDurationSeconds) }}</strong></span>
          </div>

          <div v-if="store.selectedStreamViewers.length === 0" class="text-xs text-fg-muted">
            {{ $t('audience.archive.noViewers') }}
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-line text-left text-fg-muted">
                  <th class="pb-1.5 pr-3 font-medium">{{ $t('audience.archive.columns.viewer') }}</th>
                  <th class="pb-1.5 pr-3 font-medium">{{ $t('audience.archive.columns.joined') }}</th>
                  <th class="pb-1.5 font-medium">{{ $t('audience.archive.columns.viewTime') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr
                  v-for="session in store.selectedStreamViewers"
                  :key="session.id"
                  class="text-fg-muted"
                >
                  <td class="py-1.5 pr-3 font-medium text-fg">{{ session.userLogin }}</td>
                  <td class="py-1.5 pr-3">{{ formatDate(session.joinedAt) }}</td>
                  <td class="py-1.5">{{ formatViewDuration(session.durationSeconds) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </PageSection>
</template>
