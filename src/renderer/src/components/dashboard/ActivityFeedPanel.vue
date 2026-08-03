<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { BadgeDollarSign, Gift, Heart, Radio, Sparkles, Star, Ticket, Users } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import { useActivityStore } from '@renderer/stores/activity.store'
import type { ActivityEventType } from '@shared/types/activity'

const store = useActivityStore()
const selectedTypes = ref<ActivityEventType[]>([])

let unsubscribe: (() => void) | null = null

const FILTER_TYPES: ActivityEventType[] = [
  'follow',
  'sub',
  'gift_sub',
  'bits',
  'raid',
  'channel_points'
]

const ICONS: Record<ActivityEventType, LucideIcon> = {
  follow: Heart,
  sub: Star,
  resub: Sparkles,
  gift_sub: Gift,
  bits: BadgeDollarSign,
  raid: Radio,
  channel_points: Ticket
}

onMounted(async () => {
  unsubscribe = store.subscribeToEvents()
  await store.fetchEvents({ limit: 75 })
})

onUnmounted(() => {
  unsubscribe?.()
})

watch(selectedTypes, () => {
  void store.fetchEvents({ eventTypes: selectedTypes.value, limit: 75 })
})

const visibleEvents = computed(() => store.filterLocal(selectedTypes.value))

function toggleType(type: ActivityEventType): void {
  selectedTypes.value = selectedTypes.value.includes(type)
    ? selectedTypes.value.filter((value) => value !== type)
    : [...selectedTypes.value, type]
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}
</script>

<template>
  <section class="border-t border-line pt-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-fg">{{ $t('dashboard.activity.title') }}</h2>
        <p class="mt-1 text-sm text-fg-muted">{{ $t('dashboard.activity.description') }}</p>
      </div>
      <AppButton
        v-if="store.events.length > 0"
        size="sm"
        variant="ghost"
        @click="store.clearEvents"
      >
        {{ $t('dashboard.activity.clear') }}
      </AppButton>
    </div>

    <div class="mt-4 flex flex-wrap gap-1.5">
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
        :class="
          selectedTypes.length === 0
            ? 'border-accent bg-accent text-accent-fg'
            : 'border-line-strong text-fg-muted hover:bg-surface-subtle hover:text-fg'
        "
        @click="selectedTypes = []"
      >
        <Users class="h-3.5 w-3.5" />
        {{ $t('dashboard.activity.filters.all') }}
      </button>
      <button
        v-for="type in FILTER_TYPES"
        :key="type"
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
        :class="
          selectedTypes.includes(type)
            ? 'border-accent bg-accent text-accent-fg'
            : 'border-line-strong text-fg-muted hover:bg-surface-subtle hover:text-fg'
        "
        @click="toggleType(type)"
      >
        <component :is="ICONS[type]" class="h-3.5 w-3.5" />
        {{ $t(`dashboard.activity.filters.${type}`) }}
      </button>
    </div>

    <div class="mt-4 overflow-hidden rounded-lg border border-line">
      <EmptyState
        v-if="visibleEvents.length === 0"
        :title="$t('dashboard.activity.empty')"
        :description="$t('dashboard.activity.emptyHint')"
      />
      <ul v-else class="max-h-80 divide-y divide-line overflow-y-auto">
        <li
          v-for="event in visibleEvents"
          :key="event.id"
          class="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] items-center gap-3 px-3 py-2.5"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-md bg-surface-subtle text-accent"
          >
            <component :is="ICONS[event.eventType]" class="h-4 w-4" />
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-fg">{{ event.summary }}</span>
            <span v-if="event.actorDisplayName" class="block truncate text-xs text-fg-subtle">
              {{ event.actorDisplayName }}
            </span>
          </span>
          <time class="text-right text-xs tabular-nums text-fg-subtle">
            {{ formatTime(event.occurredAt) }}
          </time>
        </li>
      </ul>
    </div>
  </section>
</template>
