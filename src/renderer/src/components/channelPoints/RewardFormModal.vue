<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import type { RewardFormState } from '@renderer/views/channelPoints/types'
import { ACTION_TYPE_LABELS } from '@renderer/views/channelPoints/utils'

const props = defineProps<{ initial: RewardFormState }>()
const emit = defineEmits<{ close: []; submit: [form: RewardFormState] }>()

const form = reactive<RewardFormState>({ ...props.initial })
const commandsStore = useCommandsStore()

onMounted(() => {
  if (commandsStore.commands.length === 0) {
    void commandsStore.fetchCommands()
  }
})

function handleSubmit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id === null ? 'Neuer Reward' : 'Reward bearbeiten'"
    @close="emit('close')"
  >
    <form class="space-y-3" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-500">Titel</label>
        <input
          v-model="form.title"
          type="text"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-500">Kosten</label>
          <input
            v-model.number="form.cost"
            type="number"
            min="1"
            required
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500">Farbe</label>
          <input
            v-model="form.backgroundColor"
            type="color"
            class="mt-1 h-9 w-full rounded-md border border-slate-300 dark:border-neutral-700"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">Prompt (optional)</label>
        <textarea
          v-model="form.prompt"
          rows="2"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">Aktion bei Einlösung</label>
        <select
          v-model="form.actionType"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option v-for="(label, type) in ACTION_TYPE_LABELS" :key="type" :value="type">
            {{ label }}
          </option>
        </select>
      </div>

      <div v-if="form.actionType === 'chat_message'">
        <label class="block text-xs font-medium text-slate-500">Nachricht</label>
        <input
          v-model="form.actionMessage"
          type="text"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div v-else-if="form.actionType === 'trigger_command'">
        <label class="block text-xs font-medium text-slate-500">Command</label>
        <select
          v-model.number="form.actionCommandId"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option :value="null" disabled>Command wählen</option>
          <option v-for="command in commandsStore.commands" :key="command.id" :value="command.id">
            {{ command.trigger }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isEnabled" type="checkbox" class="h-4 w-4 accent-twitch-purple" />
          Aktiviert
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.autoFulfill" type="checkbox" class="h-4 w-4 accent-twitch-purple" />
          Auto-Fulfill
        </label>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-neutral-700"
          @click="emit('close')"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Speichern
        </button>
      </div>
    </form>
  </BaseModal>
</template>
