<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAutomessagesStore } from '@renderer/stores/automessages.store'
import AutomessageFormModal from '@renderer/components/automessages/AutomessageFormModal.vue'
import TabBar from '@renderer/components/shared/TabBar.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { AutomessageFormState } from './types'
import { emptyAutomessageForm } from './types'
import { automessageToFormState, describeSchedule } from './utils'
import { deleteAutomessageById, submitAutomessageForm } from './functions'
import type { Automessage } from '@shared/types/automessage'

const store = useAutomessagesStore()
const isModalOpen = ref(false)
const activeForm = ref<AutomessageFormState>(emptyAutomessageForm())

const MAIN_TABS = [
  { key: 'messages', label: 'Automessages' },
  { key: 'adMessage', label: 'Werbungsnachricht' }
]
const activeTab = ref('messages')

const adMessageEnabled = ref(false)
const adMessageLeadSeconds = ref(120)
const adMessageTexts = ref<string[]>([])

onMounted(async () => {
  await Promise.all([
    store.fetchAutomessages(),
    store.fetchAdMessageSettings(),
    store.fetchAdScheduleStatus()
  ])
  adMessageEnabled.value = store.adMessageSettings.enabled
  adMessageLeadSeconds.value = store.adMessageSettings.leadSeconds
  adMessageTexts.value = [...store.adMessageSettings.texts]
})

function openCreateModal(): void {
  activeForm.value = emptyAutomessageForm()
  isModalOpen.value = true
}

function openEditModal(automessage: Automessage): void {
  activeForm.value = automessageToFormState(automessage)
  isModalOpen.value = true
}

async function handleSubmit(form: AutomessageFormState): Promise<void> {
  await submitAutomessageForm(store, form)
  isModalOpen.value = false
}

async function handleDelete(id: number): Promise<void> {
  await deleteAutomessageById(store, id)
}

async function handleSaveAdMessageSettings(): Promise<void> {
  await store.saveAdMessageSettings({
    enabled: adMessageEnabled.value,
    leadSeconds: adMessageLeadSeconds.value,
    texts: adMessageTexts.value.map((t) => t.trim()).filter((t) => t.length > 0)
  })
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE')
}
</script>

<template>
  <div>
    <div>
      <h1 class="text-2xl font-semibold">Automessages</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
        Automatische Chat-Nachrichten nach Zeitintervall, Nachrichtenanzahl oder Werbeplanung.
      </p>
    </div>

    <TabBar v-model="activeTab" :tabs="MAIN_TABS" class="mt-4" />

    <div v-show="activeTab === 'messages'" class="mt-6">
      <div class="flex items-center justify-end">
        <button
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          @click="openCreateModal"
        >
          Neue Automessage
        </button>
      </div>

      <ul class="mt-6 space-y-3">
        <li
          v-if="store.automessages.length === 0"
          class="rounded-lg border border-slate-200 p-6 text-center text-slate-500 dark:border-neutral-800"
        >
          Noch keine Automessages angelegt.
        </li>
        <li
          v-for="automessage in store.automessages"
          :key="automessage.id"
          class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                {{ describeSchedule(automessage) }} ·
                {{ automessage.messages.length }} Nachricht(en)
              </p>
              <ul class="mt-1 space-y-0.5 text-sm">
                <li v-for="(message, index) in automessage.messages" :key="index">
                  {{ message }}
                </li>
              </ul>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="
                  automessage.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-neutral-800'
                "
              >
                {{ automessage.enabled ? 'Aktiv' : 'Deaktiviert' }}
              </span>
              <button
                class="text-sm text-slate-500 hover:text-twitch-purple"
                @click="openEditModal(automessage)"
              >
                Bearbeiten
              </button>
              <button
                class="text-sm text-slate-500 hover:text-red-600"
                @click="handleDelete(automessage.id)"
              >
                Löschen
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-show="activeTab === 'adMessage'" class="mt-6 space-y-4">
      <div
        class="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        Twitch verlangt hierfür zwingend ein Token des Broadcaster-Accounts selbst -- mit einem
        Moderator-Bot-Account funktioniert der Abruf nicht. Das Feature muss zusätzlich in den
        Einstellungen unter "Werbungsnachricht" aktiviert werden.
      </div>

      <div class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="adMessageEnabled" type="checkbox" class="h-4 w-4 accent-twitch-purple" />
          Werbungsnachricht aktiviert
        </label>

        <div class="mt-3">
          <label class="block text-xs font-medium text-slate-500">Vorlaufzeit (Sekunden)</label>
          <input
            v-model.number="adMessageLeadSeconds"
            type="number"
            min="10"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div class="mt-3">
          <label class="block text-xs font-medium text-slate-500">Nachrichten-Varianten</label>
          <StringListInput v-model="adMessageTexts" class="mt-1" />
        </div>

        <button
          type="button"
          class="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          @click="handleSaveAdMessageSettings"
        >
          Speichern
        </button>
      </div>

      <div class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Aktueller Werbe-Zeitplan
        </h2>
        <p v-if="!store.adScheduleStatus" class="mt-2 text-sm text-slate-500">
          Kein Zeitplan verfügbar (nicht live, kein Broadcaster-Token oder Feature nicht aktiviert).
        </p>
        <dl v-else class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-slate-500">Nächste Werbung</dt>
          <dd>{{ formatTimestamp(store.adScheduleStatus.nextAdAt) }}</dd>
          <dt class="text-slate-500">Letzte Werbung</dt>
          <dd>{{ formatTimestamp(store.adScheduleStatus.lastAdAt) }}</dd>
        </dl>
      </div>
    </div>

    <AutomessageFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
