<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Users } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useFollowersStore } from '@renderer/stores/followers.store'

const { t, d } = useI18n()
const store = useFollowersStore()

const searchQuery = ref('')
const activeFilter = ref<'all' | 'follow' | 'unfollow'>('all')

const filtered = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let list = store.followers

  if (activeFilter.value === 'follow') {
    list = list.filter((f) => f.isActive)
  } else if (activeFilter.value === 'unfollow') {
    list = list.filter((f) => !f.isActive)
  }

  if (!query) return list
  return list.filter(
    (f) =>
      f.userLogin.toLowerCase().includes(query) ||
      (f.displayName?.toLowerCase().includes(query) ?? false)
  )
})

function formatDate(ts: number): string {
  return d(new Date(ts * 1000), 'short')
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const days = Math.floor(seconds / 86400)
  if (days >= 1) return t('audience.followers.durationDays', { days })
  const hours = Math.floor(seconds / 3600)
  if (hours >= 1) return t('audience.followers.durationHours', { hours })
  return t('audience.followers.durationMinutes', { minutes: Math.floor(seconds / 60) })
}

function lastSyncLabel(): string {
  if (!store.syncStatus.lastSyncedAt) return t('audience.followers.neverSynced')
  return d(new Date(store.syncStatus.lastSyncedAt * 1000), 'short')
}
</script>

<template>
  <PageSection :title="$t('audience.followers.title')" :divided="false">
    <template #actions>
      <span class="text-xs text-fg-muted">{{ $t('audience.followers.lastSync') }}: {{ lastSyncLabel() }}</span>
      <AppButton
        size="sm"
        :disabled="store.syncing"
        @click="store.syncNow()"
      >
        {{ store.syncing ? $t('audience.followers.syncing') : $t('audience.followers.syncNow') }}
      </AppButton>
    </template>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="min-w-52 flex-1">
        <AppInput
          v-model="searchQuery"
          :placeholder="$t('audience.followers.searchPlaceholder')"
        />
      </div>

      <div class="flex gap-1">
        <button
          v-for="filter in (['all', 'follow', 'unfollow'] as const)"
          :key="filter"
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="activeFilter === filter
            ? 'bg-accent/10 text-accent'
            : 'text-fg-muted hover:text-fg'"
          @click="activeFilter = filter"
        >
          {{ $t(`audience.followers.filter.${filter}`) }}
        </button>
      </div>

      <AppBadge variant="neutral">
        {{ $t('audience.followers.total', { count: store.syncStatus.totalCount }) }}
      </AppBadge>
    </div>

    <EmptyState
      v-if="store.followers.length === 0 && !store.loading"
      :title="$t('audience.followers.empty')"
      :description="$t('audience.followers.emptyHint')"
    >
      <template #icon><Users class="h-8 w-8" /></template>
    </EmptyState>

    <EmptyState
      v-else-if="filtered.length === 0"
      :title="$t('audience.followers.noMatches')"
    />

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-line text-left text-xs text-fg-muted">
            <th class="pb-2 pr-4 font-medium">{{ $t('audience.followers.columns.name') }}</th>
            <th class="pb-2 pr-4 font-medium">{{ $t('audience.followers.columns.followedAt') }}</th>
            <th class="pb-2 pr-4 font-medium">{{ $t('audience.followers.columns.status') }}</th>
            <th class="pb-2 font-medium">{{ $t('audience.followers.columns.duration') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="follower in filtered" :key="follower.userId" class="py-2">
            <td class="py-2 pr-4">
              <span class="font-medium text-fg">{{ follower.displayName ?? follower.userLogin }}</span>
              <span v-if="follower.displayName" class="ml-1.5 text-xs text-fg-muted">@{{ follower.userLogin }}</span>
            </td>
            <td class="py-2 pr-4 text-fg-muted">{{ formatDate(follower.followedAt) }}</td>
            <td class="py-2 pr-4">
              <AppBadge :variant="follower.isActive ? 'success' : 'neutral'">
                {{ follower.isActive ? $t('audience.followers.status.active') : $t('audience.followers.status.unfollowed') }}
              </AppBadge>
            </td>
            <td class="py-2 text-fg-muted">
              {{ follower.isActive
                ? formatDuration(Math.floor(Date.now() / 1000) - follower.followedAt)
                : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </PageSection>
</template>
