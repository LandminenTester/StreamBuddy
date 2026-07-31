<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import CommandFormModal from '@renderer/components/commands/CommandFormModal.vue'
import type { CommandFormState } from './types'
import { emptyCommandForm } from './types'
import { commandToFormState, PERMISSION_LABELS } from './utils'
import { deleteCommandById, submitCommandForm } from './functions'
import type { Command } from '@shared/types/command'

const store = useCommandsStore()
const isModalOpen = ref(false)
const activeForm = ref<CommandFormState>(emptyCommandForm())

onMounted(() => {
  void store.fetchCommands()
})

function openCreateModal(): void {
  activeForm.value = emptyCommandForm()
  isModalOpen.value = true
}

function openEditModal(command: Command): void {
  activeForm.value = commandToFormState(command)
  isModalOpen.value = true
}

async function handleSubmit(form: CommandFormState): Promise<void> {
  await submitCommandForm(store, form)
  isModalOpen.value = false
}

async function handleDelete(id: number): Promise<void> {
  await deleteCommandById(store, id)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Commands</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          Chat-Befehle mit Berechtigung, Cooldown und Aliasen.
        </p>
      </div>
      <button
        class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        @click="openCreateModal"
      >
        Neuer Command
      </button>
    </div>

    <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-neutral-900">
          <tr>
            <th class="px-4 py-2">Trigger</th>
            <th class="px-4 py-2">Berechtigung</th>
            <th class="px-4 py-2">Cooldown</th>
            <th class="px-4 py-2">Nutzungen</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2" />
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-800">
          <tr v-if="store.commands.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">
              Noch keine Commands angelegt.
            </td>
          </tr>
          <tr v-for="command in store.commands" :key="command.id">
            <td class="px-4 py-2 font-mono">{{ command.trigger }}</td>
            <td class="px-4 py-2">{{ PERMISSION_LABELS[command.permissionLevel] }}</td>
            <td class="px-4 py-2">{{ command.cooldownSeconds }}s</td>
            <td class="px-4 py-2">{{ command.useCount }}</td>
            <td class="px-4 py-2">
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="
                  command.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-neutral-800'
                "
              >
                {{ command.enabled ? 'Aktiv' : 'Deaktiviert' }}
              </span>
            </td>
            <td class="px-4 py-2 text-right">
              <button
                class="text-slate-500 hover:text-twitch-purple"
                @click="openEditModal(command)"
              >
                Bearbeiten
              </button>
              <button
                class="ml-3 text-slate-500 hover:text-red-600"
                @click="handleDelete(command.id)"
              >
                Löschen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CommandFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
