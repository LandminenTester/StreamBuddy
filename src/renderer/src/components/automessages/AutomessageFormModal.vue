<script setup lang="ts">
import { reactive } from 'vue'
import BaseModal from '@renderer/components/shared/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { AutomessageFormState } from '@renderer/views/automessages/types'
import { MODE_LABELS } from '@renderer/views/automessages/utils'

const props = defineProps<{ initial: AutomessageFormState }>()
const emit = defineEmits<{ close: []; submit: [form: AutomessageFormState] }>()

const form = reactive<AutomessageFormState>({ ...props.initial })

function handleSubmit(): void {
  if (!form.messages.some((m) => m.trim().length > 0)) return
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id === null ? 'Neue Automessage' : 'Automessage bearbeiten'"
    @close="emit('close')"
  >
    <form class="space-y-3" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-500">
          Nachrichten (werden zufällig rotiert)
        </label>
        <StringListInput
          v-model="form.messages"
          placeholder="Folge dem Kanal für Benachrichtigungen!"
          class="mt-1"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">Modus</label>
        <select
          v-model="form.mode"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option v-for="(label, mode) in MODE_LABELS" :key="mode" :value="mode">
            {{ label }}
          </option>
        </select>
      </div>

      <div v-if="form.mode === 'interval'">
        <label class="block text-xs font-medium text-slate-500">Intervall (Minuten)</label>
        <input
          v-model.number="form.intervalMinutes"
          type="number"
          min="1"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div v-else>
        <label class="block text-xs font-medium text-slate-500">Nach X Chat-Nachrichten</label>
        <input
          v-model.number="form.messageCountThreshold"
          type="number"
          min="1"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">
          Mindest-Chat-Aktivität seit letzter Sendung (verhindert Spam in leerem Chat)
        </label>
        <input
          v-model.number="form.minChatLinesSinceLast"
          type="number"
          min="0"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-twitch-purple" />
        Aktiviert
      </label>

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
