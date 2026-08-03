<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Gift, Plus } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useChannelPointsStore } from '@renderer/stores/channelPoints.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import RewardFormModal from '@renderer/components/channelPoints/RewardFormModal.vue'
import type { RewardFormState } from './types'
import { emptyRewardForm } from './types'
import { actionTypeLabel, rewardToFormState } from './utils'
import { deleteRewardById, submitRewardForm } from './functions'
import type { ChannelPointReward } from '@shared/types/channelPointReward'

const { t } = useI18n()
const store = useChannelPointsStore()
const authStore = useAuthStore()
const isModalOpen = ref(false)
const activeForm = ref<RewardFormState>(emptyRewardForm())

// channel_points-Feature muss separat in den Einstellungen aktiviert sein, sonst
// wird die EventSub-Subscription für Redemptions nie registriert -- Rewards mit
// konfigurierter Aktion würden dann unbemerkt nie feuern (siehe eventSubClient.ts).
const isChannelPointsFeatureEnabled = computed(() =>
  authStore.features.some((f) => f.featureKey === 'channel_points' && f.enabled)
)
const hasRewardsWithAction = computed(() => store.rewards.some((r) => r.actionType !== 'none'))

let unsubscribe: (() => void) | null = null

onMounted(() => {
  void store.fetchRewards()
  void store.fetchRedemptions()
  void authStore.fetchFeatures()
  unsubscribe = store.subscribeToRedemptions()
})

onUnmounted(() => {
  unsubscribe?.()
})

const columns = computed<DataTableColumn[]>(() => [
  { key: 'title', label: t('channelPoints.columns.title') },
  { key: 'cost', label: t('channelPoints.columns.cost'), align: 'right' },
  { key: 'action', label: t('channelPoints.columns.action') },
  { key: 'status', label: t('channelPoints.columns.status') },
  { key: 'actions', label: '', align: 'right' }
])

function openCreateModal(): void {
  activeForm.value = emptyRewardForm()
  isModalOpen.value = true
}

function openEditModal(reward: ChannelPointReward): void {
  activeForm.value = rewardToFormState(reward)
  isModalOpen.value = true
}

async function handleSubmit(form: RewardFormState): Promise<void> {
  try {
    await submitRewardForm(store, form)
    isModalOpen.value = false
  } catch {
    // Modal bleibt offen, Fehler wird über store.error angezeigt.
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <PageHeader :title="$t('channelPoints.title')" :description="$t('channelPoints.description')">
      <template #actions>
        <AppButton variant="primary" @click="openCreateModal">
          <template #icon><Plus class="h-4 w-4" /></template>
          {{ $t('channelPoints.new') }}
        </AppButton>
      </template>
    </PageHeader>

    <p v-if="store.error" class="text-sm text-danger">{{ store.error }}</p>

    <p
      v-if="!isChannelPointsFeatureEnabled && hasRewardsWithAction"
      class="rounded-md bg-warning-bg p-4 text-sm text-warning"
    >
      {{ $t('channelPoints.featureDisabled') }}
    </p>

    <DataTable
      :columns="columns"
      :rows="store.rewards"
      :row-key="(row: ChannelPointReward) => row.id"
    >
      <template #empty>
        <EmptyState
          :title="$t('channelPoints.empty')"
          :description="$t('channelPoints.emptyHint')"
        >
          <template #icon><Gift class="h-8 w-8" /></template>
          <template #action>
            <AppButton variant="primary" size="sm" @click="openCreateModal">
              {{ $t('channelPoints.new') }}
            </AppButton>
          </template>
        </EmptyState>
      </template>

      <template #title="{ row }">
        <span class="flex items-center gap-2">
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: row.backgroundColor ?? '#9146FF' }"
          />
          {{ row.title }}
        </span>
      </template>
      <template #cost="{ row }">
        <span class="tabular-nums">{{ row.cost }}</span>
      </template>
      <template #action="{ row }">
        <span class="text-fg-muted">{{ actionTypeLabel(row.actionType) }}</span>
      </template>
      <template #status="{ row }">
        <AppBadge :variant="row.isEnabled ? 'success' : 'neutral'">
          {{ row.isEnabled ? $t('common.enabled') : $t('common.disabled') }}
        </AppBadge>
      </template>
      <template #actions="{ row }">
        <span class="flex items-center justify-end gap-1">
          <AppButton size="sm" variant="ghost" @click="openEditModal(row)">
            {{ $t('common.edit') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="deleteRewardById(store, row.id)">
            {{ $t('common.delete') }}
          </AppButton>
        </span>
      </template>
    </DataTable>

    <PageSection :title="$t('channelPoints.redemptions.title')">
      <EmptyState
        v-if="store.redemptions.length === 0"
        :title="$t('channelPoints.redemptions.empty')"
      />
      <ul v-else class="divide-y divide-line border-t border-line">
        <li
          v-for="entry in store.redemptions"
          :key="entry.id"
          class="flex items-center justify-between gap-4 py-2.5 text-sm"
        >
          <span class="min-w-0 truncate text-fg">
            {{ entry.userLogin }}
            <span v-if="entry.rewardTitle" class="text-fg-muted">
              - {{ entry.rewardTitle }}
            </span>
            <span v-if="entry.userInput" class="text-fg-muted">— „{{ entry.userInput }}“</span>
          </span>
          <span class="shrink-0 text-xs text-fg-subtle">{{ entry.status }}</span>
        </li>
      </ul>
    </PageSection>

    <RewardFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
