<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Minus, Trash2, Pencil, Check, X, Type, Hash } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import { useTrackersStore } from '@renderer/stores/trackers.store'
import type { WertType } from '@shared/types/tracker'

useI18n()
const store = useTrackersStore()

const newLabel = ref('')
const newType = ref<WertType>('counter')

const editingId = ref<number | null>(null)
const editLabel = ref('')

const editingValueId = ref<number | null>(null)
const editTextValue = ref('')

async function addWert(): Promise<void> {
  if (!newLabel.value.trim()) return
  await store.createTracker({ label: newLabel.value, type: newType.value })
  newLabel.value = ''
  newType.value = 'counter'
}

function startEdit(id: number, label: string): void {
  editingId.value = id
  editLabel.value = label
}

async function confirmEdit(id: number): Promise<void> {
  if (editLabel.value.trim()) {
    await store.updateTracker(id, { label: editLabel.value })
  }
  editingId.value = null
}

function cancelEdit(): void {
  editingId.value = null
}

function startEditTextValue(id: number, currentValue: string | null): void {
  editingValueId.value = id
  editTextValue.value = currentValue ?? ''
}

async function confirmTextValue(id: number): Promise<void> {
  await store.setTextValue(id, editTextValue.value)
  editingValueId.value = null
}

function cancelTextValue(): void {
  editingValueId.value = null
}
</script>

<template>
  <aside class="flex w-64 flex-col gap-4 border-l border-line pl-6">
    <h3 class="text-sm font-semibold text-fg">{{ $t('commands.werte.title') }}</h3>

    <div class="flex flex-col gap-2">
      <div
        v-for="tracker in store.trackers"
        :key="tracker.id"
        class="rounded-lg border border-line bg-surface p-3"
      >
        <!-- Label-Zeile -->
        <div v-if="editingId === tracker.id" class="flex items-center gap-1">
          <AppInput
            v-model="editLabel"
            class="flex-1 text-xs"
            @keyup.enter="confirmEdit(tracker.id)"
            @keyup.escape="cancelEdit"
          />
          <button type="button" class="text-fg-muted hover:text-fg" @click="confirmEdit(tracker.id)">
            <Check class="h-3.5 w-3.5" />
          </button>
          <button type="button" class="text-fg-muted hover:text-fg" @click="cancelEdit">
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
        <div v-else class="flex items-center justify-between gap-1">
          <div class="flex min-w-0 items-center gap-1.5">
            <Hash v-if="tracker.type === 'counter'" class="h-3 w-3 shrink-0 text-fg-muted" />
            <Type v-else class="h-3 w-3 shrink-0 text-fg-muted" />
            <span class="truncate text-xs text-fg-muted">{{ tracker.label }}</span>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="text-fg-muted hover:text-fg"
              @click="startEdit(tracker.id, tracker.label)"
            >
              <Pencil class="h-3 w-3" />
            </button>
            <button
              type="button"
              class="text-fg-muted hover:text-danger"
              @click="store.deleteTracker(tracker.id)"
            >
              <Trash2 class="h-3 w-3" />
            </button>
          </div>
        </div>

        <!-- Zähler-Steuerung -->
        <div v-if="tracker.type === 'counter'" class="mt-2 flex items-center gap-2">
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded border border-line text-fg-muted hover:bg-surface-raised hover:text-fg"
            @click="store.adjustTracker(tracker.id, -1)"
          >
            <Minus class="h-3 w-3" />
          </button>
          <span class="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-fg">
            {{ tracker.value }}
          </span>
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded border border-line text-fg-muted hover:bg-surface-raised hover:text-fg"
            @click="store.adjustTracker(tracker.id, 1)"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>

        <!-- Textwert-Bearbeitung -->
        <div v-else class="mt-2">
          <div v-if="editingValueId === tracker.id" class="flex items-center gap-1">
            <AppInput
              v-model="editTextValue"
              class="flex-1 text-xs"
              @keyup.enter="confirmTextValue(tracker.id)"
              @keyup.escape="cancelTextValue"
            />
            <button
              type="button"
              class="text-fg-muted hover:text-fg"
              @click="confirmTextValue(tracker.id)"
            >
              <Check class="h-3.5 w-3.5" />
            </button>
            <button type="button" class="text-fg-muted hover:text-fg" @click="cancelTextValue">
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            v-else
            type="button"
            class="flex w-full items-center gap-1.5 rounded border border-line px-2 py-1 text-left hover:bg-surface-raised"
            @click="startEditTextValue(tracker.id, tracker.textValue)"
          >
            <span class="min-w-0 flex-1 truncate text-xs text-fg">
              {{ tracker.textValue || $t('commands.werte.emptyTextValue') }}
            </span>
            <Pencil class="h-3 w-3 shrink-0 text-fg-muted" />
          </button>
        </div>
      </div>

      <p v-if="store.trackers.length === 0" class="text-xs text-fg-muted">
        {{ $t('commands.werte.empty') }}
      </p>
    </div>

    <!-- Neu-anlegen -->
    <div class="space-y-2">
      <div class="flex gap-1 rounded-md border border-line p-0.5">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors"
          :class="newType === 'counter' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'"
          @click="newType = 'counter'"
        >
          <Hash class="h-3 w-3" />
          {{ $t('commands.werte.typeCounter') }}
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors"
          :class="newType === 'text' ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'"
          @click="newType = 'text'"
        >
          <Type class="h-3 w-3" />
          {{ $t('commands.werte.typeText') }}
        </button>
      </div>
      <div class="flex gap-2">
        <AppInput
          v-model="newLabel"
          :placeholder="$t('commands.werte.placeholder')"
          class="flex-1 text-xs"
          @keyup.enter="addWert"
        />
        <AppButton size="sm" variant="ghost" :disabled="!newLabel.trim()" @click="addWert">
          <template #icon><Plus class="h-3.5 w-3.5" /></template>
        </AppButton>
      </div>
    </div>
  </aside>
</template>
