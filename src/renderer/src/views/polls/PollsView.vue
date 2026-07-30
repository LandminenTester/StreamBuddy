<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePollsStore } from '@renderer/stores/polls.store'
import PollResultsBars from '@renderer/components/polls/PollResultsBars.vue'
import { emptyPollForm } from './types'
import { STATUS_LABELS } from './utils'
import { submitPollForm } from './functions'

const store = usePollsStore()
const form = ref(emptyPollForm())

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await store.fetchPolls()
  unsubscribe = store.subscribeToUpdates()
})

onUnmounted(() => {
  unsubscribe?.()
})

const activePoll = computed(() => store.polls.find((p) => p.status === 'active'))
const pastPolls = computed(() => store.polls.filter((p) => p.status !== 'active'))

async function handleCreate(): Promise<void> {
  await submitPollForm(store, form.value)
  if (!store.error) form.value = emptyPollForm()
}

async function handleEnd(id: number): Promise<void> {
  await store.endPoll(id)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Umfragen</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Twitch-Polls erstellen und Ergebnisse live verfolgen.
      </p>
    </div>

    <section v-if="activePoll" class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div class="flex items-center justify-between">
        <h2 class="font-medium">{{ activePoll.title }}</h2>
        <button
          class="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          @click="handleEnd(activePoll.id)"
        >
          Beenden
        </button>
      </div>
      <div class="mt-3">
        <PollResultsBars :poll="activePoll" />
      </div>
    </section>

    <section v-else class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Neue Umfrage</h2>
      <form class="mt-3 space-y-3" @submit.prevent="handleCreate">
        <div>
          <label class="block text-xs font-medium text-slate-500">Titel</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500">
            Antwortoptionen (eine pro Zeile, min. 2)
          </label>
          <textarea
            v-model="form.choicesInput"
            rows="4"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500">Dauer (Sekunden)</label>
          <input
            v-model.number="form.durationSeconds"
            type="number"
            min="15"
            max="1800"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="form.channelPointsVotingEnabled"
            type="checkbox"
            class="h-4 w-4 accent-twitch-purple"
          />
          Abstimmen mit Kanalpunkten erlauben
        </label>
        <div v-if="form.channelPointsVotingEnabled">
          <label class="block text-xs font-medium text-slate-500">Kanalpunkte pro Stimme</label>
          <input
            v-model.number="form.channelPointsPerVote"
            type="number"
            min="1"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <p v-if="store.error" class="text-sm text-red-600">{{ store.error }}</p>

        <button
          type="submit"
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="store.isCreating"
        >
          {{ store.isCreating ? 'Wird gestartet…' : 'Umfrage starten' }}
        </button>
      </form>
    </section>

    <section>
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Historie</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-if="pastPolls.length === 0"
          class="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-800"
        >
          Noch keine vergangenen Umfragen.
        </li>
        <li
          v-for="poll in pastPolls"
          :key="poll.id"
          class="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ poll.title }}</span>
            <span class="text-xs text-slate-500">{{ STATUS_LABELS[poll.status] }}</span>
          </div>
          <div class="mt-2">
            <PollResultsBars :poll="poll" />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
