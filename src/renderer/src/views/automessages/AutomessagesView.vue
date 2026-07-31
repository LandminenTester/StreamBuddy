<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAutomessagesStore } from '@renderer/stores/automessages.store'
import AutomessageFormModal from '@renderer/components/automessages/AutomessageFormModal.vue'
import type { AutomessageFormState } from './types'
import { emptyAutomessageForm } from './types'
import { automessageToFormState, describeSchedule } from './utils'
import { deleteAutomessageById, submitAutomessageForm } from './functions'
import type { Automessage } from '@shared/types/automessage'

const store = useAutomessagesStore()
const isModalOpen = ref(false)
const activeForm = ref<AutomessageFormState>(emptyAutomessageForm())

onMounted(() => {
  void store.fetchAutomessages()
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
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Automessages</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          Automatische Chat-Nachrichten nach Zeitintervall oder Nachrichtenanzahl.
        </p>
      </div>
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
              {{ describeSchedule(automessage) }} · {{ automessage.messages.length }} Nachricht(en)
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

    <AutomessageFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
