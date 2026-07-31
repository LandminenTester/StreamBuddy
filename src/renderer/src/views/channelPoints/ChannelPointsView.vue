<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useChannelPointsStore } from '@renderer/stores/channelPoints.store'
import { useAuthStore } from '@renderer/stores/auth.store'
import RewardFormModal from '@renderer/components/channelPoints/RewardFormModal.vue'
import type { RewardFormState } from './types'
import { emptyRewardForm } from './types'
import { rewardToFormState } from './utils'
import { deleteRewardById, submitRewardForm } from './functions'
import type { ChannelPointReward } from '@shared/types/channelPointReward'

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
    // Modal bleibt offen, Fehler wird über store.error angezeigt (siehe unten).
  }
}

async function handleDelete(id: number): Promise<void> {
  await deleteRewardById(store, id)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Kanalpunkte</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Custom Rewards verwalten und auf Einlösungen reagieren.
          </p>
        </div>
        <button
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          @click="openCreateModal"
        >
          Neuer Reward
        </button>
      </div>

      <p v-if="store.error" class="mt-3 text-sm text-red-600">{{ store.error }}</p>

      <div
        v-if="!isChannelPointsFeatureEnabled && hasRewardsWithAction"
        class="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        Das Feature "Kanalpunkte" ist in den Einstellungen deaktiviert. Solange das der Fall ist,
        werden Einlösungen nicht empfangen und konfigurierte Aktionen (z.B. Chatnachrichten) feuern
        nie. Aktiviere es unter Einstellungen → Features.
      </div>

      <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-neutral-900">
            <tr>
              <th class="px-4 py-2">Titel</th>
              <th class="px-4 py-2">Kosten</th>
              <th class="px-4 py-2">Aktion</th>
              <th class="px-4 py-2">Status</th>
              <th class="px-4 py-2" />
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-800">
            <tr v-if="store.rewards.length === 0">
              <td colspan="5" class="px-4 py-6 text-center text-slate-500">
                Noch keine Rewards angelegt.
              </td>
            </tr>
            <tr v-for="reward in store.rewards" :key="reward.id">
              <td class="px-4 py-2">
                <span
                  class="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                  :style="{ backgroundColor: reward.backgroundColor ?? '#9146FF' }"
                />
                {{ reward.title }}
              </td>
              <td class="px-4 py-2">{{ reward.cost }}</td>
              <td class="px-4 py-2 text-xs">{{ reward.actionType }}</td>
              <td class="px-4 py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="
                    reward.isEnabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-neutral-800'
                  "
                >
                  {{ reward.isEnabled ? 'Aktiv' : 'Deaktiviert' }}
                </span>
              </td>
              <td class="px-4 py-2 text-right">
                <button
                  class="text-slate-500 hover:text-twitch-purple"
                  @click="openEditModal(reward)"
                >
                  Bearbeiten
                </button>
                <button
                  class="ml-3 text-slate-500 hover:text-red-600"
                  @click="handleDelete(reward.id)"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Letzte Einlösungen
      </h2>
      <ul class="mt-3 space-y-2">
        <li
          v-if="store.redemptions.length === 0"
          class="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-neutral-800"
        >
          Noch keine Einlösungen.
        </li>
        <li
          v-for="entry in store.redemptions"
          :key="entry.id"
          class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-neutral-800"
        >
          <span
            >{{ entry.userLogin
            }}<span v-if="entry.userInput"> — "{{ entry.userInput }}"</span></span
          >
          <span class="text-xs text-slate-500">{{ entry.status }}</span>
        </li>
      </ul>
    </div>

    <RewardFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
