<script setup lang="ts">
import { reactive } from 'vue'
import BaseModal from '@renderer/components/shared/BaseModal.vue'
import type { CommandFormState } from '@renderer/views/commands/types'
import { DELIVERY_MODE_LABELS, PERMISSION_LABELS } from '@renderer/views/commands/utils'

const props = defineProps<{ initial: CommandFormState }>()
const emit = defineEmits<{ close: []; submit: [form: CommandFormState] }>()

const form = reactive<CommandFormState>({ ...props.initial })

function handleSubmit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id === null ? 'Neuer Command' : 'Command bearbeiten'"
    @close="emit('close')"
  >
    <form class="space-y-3" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-500">Trigger</label>
        <input
          v-model="form.trigger"
          type="text"
          placeholder="!uptime"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">Antwort</label>
        <textarea
          v-model="form.response"
          rows="3"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500"> Aliase (kommagetrennt) </label>
        <input
          v-model="form.aliasesInput"
          type="text"
          placeholder="!time, !howlong"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-500">Berechtigung</label>
          <select
            v-model="form.permissionLevel"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option v-for="(label, level) in PERMISSION_LABELS" :key="level" :value="level">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500">Cooldown (Sek.)</label>
          <input
            v-model.number="form.cooldownSeconds"
            type="number"
            min="0"
            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-500">Zustellart</label>
        <select
          v-model="form.deliveryMode"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option v-for="(label, mode) in DELIVERY_MODE_LABELS" :key="mode" :value="mode">
            {{ label }}
          </option>
        </select>
        <p v-if="form.deliveryMode === 'whisper'" class="mt-1 text-xs text-amber-600">
          Twitch schränkt Whispers für viele Bot-Accounts ein -- ggf. funktioniert das nicht
          zuverlässig, unbedingt testen.
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-twitch-purple" />
        Aktiviert
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
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
