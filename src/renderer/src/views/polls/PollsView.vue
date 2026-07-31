<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePollsStore } from '@renderer/stores/polls.store'
import { usePollTemplatesStore } from '@renderer/stores/pollTemplates.store'
import PollResultsBars from '@renderer/components/polls/PollResultsBars.vue'
import PollTemplateFormModal from '@renderer/components/polls/PollTemplateFormModal.vue'
import type { PollTemplate } from '@shared/types/poll'
import { emptyPollForm, emptyPollTemplateForm } from './types'
import type { PollTemplateFormState } from './types'
import { STATUS_LABELS } from './utils'
import {
  saveCurrentFormAsTemplate,
  sendPollTemplate,
  submitPollForm,
  submitPollTemplateForm
} from './functions'

const store = usePollsStore()
const templatesStore = usePollTemplatesStore()
const form = ref(emptyPollForm())

const isTemplateModalOpen = ref(false)
const activeTemplateForm = ref<PollTemplateFormState>(emptyPollTemplateForm())

const endingPollId = ref<number | null>(null)
const selectedWinnerIndex = ref<number | null>(null)

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  await store.fetchPolls()
  await templatesStore.fetchTemplates()
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

async function handleSaveAsTemplate(): Promise<void> {
  if (!form.value.title.trim()) return
  await saveCurrentFormAsTemplate(templatesStore, form.value)
}

function highestVoteIndex(choices: { votes: number }[]): number {
  let bestIndex = 0
  for (let i = 1; i < choices.length; i++) {
    if (choices[i].votes > choices[bestIndex].votes) bestIndex = i
  }
  return bestIndex
}

function startEnding(id: number): void {
  const poll = store.polls.find((p) => p.id === id)
  endingPollId.value = id
  selectedWinnerIndex.value = poll ? highestVoteIndex(poll.choices) : 0
}

function cancelEnding(): void {
  endingPollId.value = null
  selectedWinnerIndex.value = null
}

async function confirmEnding(): Promise<void> {
  if (endingPollId.value === null) return
  await store.endPoll(endingPollId.value, selectedWinnerIndex.value)
  cancelEnding()
}

async function handleReset(id: number): Promise<void> {
  await store.resetPoll(id)
  if (endingPollId.value === id) cancelEnding()
}

function openCreateTemplateModal(): void {
  activeTemplateForm.value = emptyPollTemplateForm()
  isTemplateModalOpen.value = true
}

function openEditTemplateModal(template: PollTemplate): void {
  activeTemplateForm.value = {
    id: template.id,
    title: template.title,
    choicesInput: template.choices.join('\n'),
    durationSeconds: template.durationSeconds,
    channelPointsVotingEnabled: template.channelPointsVotingEnabled,
    channelPointsPerVote: template.channelPointsPerVote
  }
  isTemplateModalOpen.value = true
}

async function handleTemplateSubmit(templateForm: PollTemplateFormState): Promise<void> {
  await submitPollTemplateForm(templatesStore, templateForm)
  isTemplateModalOpen.value = false
}

async function handleDeleteTemplate(id: number): Promise<void> {
  await templatesStore.deleteTemplate(id)
}

async function handleSendTemplate(template: PollTemplate): Promise<void> {
  await sendPollTemplate(store, template)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Umfragen</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Twitch-Polls erstellen und Ergebnisse live verfolgen.
      </p>
    </div>

    <section
      v-if="activePoll"
      class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-medium">{{ activePoll.title }}</h2>
        <div v-if="endingPollId !== activePoll.id" class="flex items-center gap-2">
          <button
            class="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
            @click="startEnding(activePoll.id)"
          >
            Beenden
          </button>
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            title="Setzt die Umfrage nur lokal zurück, ohne Twitch zu kontaktieren -- für den Fall, dass sie auf Twitch längst nicht mehr existiert."
            @click="handleReset(activePoll.id)"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
      <div class="mt-3">
        <PollResultsBars :poll="activePoll" />
      </div>

      <div
        v-if="endingPollId === activePoll.id"
        class="mt-3 rounded-md border border-slate-200 p-3 dark:border-neutral-800"
      >
        <p class="text-xs font-medium text-slate-500">Gewinner auswählen und Umfrage beenden:</p>
        <div class="mt-2 space-y-1">
          <label
            v-for="(choice, index) in activePoll.choices"
            :key="index"
            class="flex items-center gap-2 text-sm"
          >
            <input
              v-model.number="selectedWinnerIndex"
              type="radio"
              :value="index"
              class="h-4 w-4 accent-twitch-purple"
            />
            {{ choice.title }} ({{ choice.votes }} Stimmen)
          </label>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <button
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            @click="cancelEnding"
          >
            Abbrechen
          </button>
          <button
            class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            @click="confirmEnding"
          >
            Bestätigen & Beenden
          </button>
        </div>
      </div>
    </section>

    <section v-else class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Neue Umfrage</h2>
      <form class="mt-3 space-y-3" @submit.prevent="handleCreate">
        <div>
          <label class="block text-xs font-medium text-slate-500">Titel</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
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
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500">Dauer (Sekunden)</label>
          <input
            v-model.number="form.durationSeconds"
            type="number"
            min="15"
            max="1800"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
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
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <p v-if="store.error" class="text-sm text-red-600">{{ store.error }}</p>

        <div class="flex gap-2">
          <button
            type="submit"
            class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            :disabled="store.isCreating"
          >
            {{ store.isCreating ? 'Wird gestartet…' : 'Umfrage starten' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-neutral-700"
            @click="handleSaveAsTemplate"
          >
            Als Template speichern
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Umfrage-Templates
        </h2>
        <button
          class="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-neutral-700"
          @click="openCreateTemplateModal"
        >
          Neues Template
        </button>
      </div>
      <ul class="mt-3 space-y-2">
        <li
          v-if="templatesStore.templates.length === 0"
          class="py-4 text-center text-sm text-slate-500"
        >
          Noch keine Templates gespeichert.
        </li>
        <li
          v-for="template in templatesStore.templates"
          :key="template.id"
          class="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm dark:border-neutral-800"
        >
          <div>
            <p class="font-medium">{{ template.title }}</p>
            <p class="text-xs text-slate-500">{{ template.choices.join(' / ') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md bg-twitch-purple px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              @click="handleSendTemplate(template)"
            >
              Senden
            </button>
            <button
              class="text-xs text-slate-500 hover:text-twitch-purple"
              @click="openEditTemplateModal(template)"
            >
              Bearbeiten
            </button>
            <button
              class="text-xs text-slate-500 hover:text-red-600"
              @click="handleDeleteTemplate(template.id)"
            >
              Löschen
            </button>
          </div>
        </li>
      </ul>
    </section>

    <PollTemplateFormModal
      v-if="isTemplateModalOpen"
      :initial="activeTemplateForm"
      @close="isTemplateModalOpen = false"
      @submit="handleTemplateSubmit"
    />

    <section>
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Historie</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-if="pastPolls.length === 0"
          class="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-neutral-800"
        >
          Noch keine vergangenen Umfragen.
        </li>
        <li
          v-for="poll in pastPolls"
          :key="poll.id"
          class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ poll.title }}</span>
            <span class="text-xs text-slate-500">{{ STATUS_LABELS[poll.status] }}</span>
          </div>
          <p
            v-if="poll.winnerChoiceIndex !== null && poll.choices[poll.winnerChoiceIndex]"
            class="mt-1 text-xs font-medium text-twitch-purple"
          >
            Gewinner: {{ poll.choices[poll.winnerChoiceIndex].title }}
          </p>
          <div class="mt-2">
            <PollResultsBars :poll="poll" />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
