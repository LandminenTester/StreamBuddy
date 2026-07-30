<script setup lang="ts">
import { reactive } from 'vue'
import BaseModal from '@renderer/components/shared/BaseModal.vue'
import type { AccountEditFormState } from '@renderer/views/loyalty/types'

const props = defineProps<{ initial: AccountEditFormState }>()
const emit = defineEmits<{ close: []; submit: [form: AccountEditFormState] }>()

const form = reactive<AccountEditFormState>({ ...props.initial })

function handleSubmit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal :title="`Konto bearbeiten: ${form.userLogin}`" @close="emit('close')">
    <form class="space-y-3" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-500">Kontostand</label>
        <input
          v-model.number="form.balance"
          type="number"
          min="0"
          required
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

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
