<script setup lang="ts">
import { reactive } from 'vue'
import BaseModal from '@renderer/components/shared/BaseModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import type { PollTemplateFormState } from '@renderer/views/polls/types'

const props = defineProps<{ initial: PollTemplateFormState }>()
const emit = defineEmits<{ close: []; submit: [form: PollTemplateFormState] }>()

const form = reactive<PollTemplateFormState>({ ...props.initial })

function handleSubmit(): void {
  if (form.choices.filter((c) => c.trim().length > 0).length < 2) return
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id === null ? 'Neues Umfrage-Template' : 'Template bearbeiten'"
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
      <div>
        <label class="block text-xs font-medium text-slate-500"> Antwortoptionen (mind. 2) </label>
        <StringListInput v-model="form.choices" class="mt-1" />
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
