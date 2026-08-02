<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Minus, Trash2, Pencil, Check, X } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import { useTrackersStore } from '@renderer/stores/trackers.store'

useI18n()
const store = useTrackersStore()

const newLabel = ref('')
const editingId = ref<number | null>(null)
const editLabel = ref('')

async function addTracker(): Promise<void> {
  if (!newLabel.value.trim()) return
  await store.createTracker({ label: newLabel.value })
  newLabel.value = ''
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
</script>

<template>
  <aside class="flex w-64 flex-col gap-4 border-l border-line pl-6">
    <h3 class="text-sm font-semibold text-fg">{{ $t('commands.trackers.title') }}</h3>

    <div class="flex flex-col gap-2">
      <div
        v-for="tracker in store.trackers"
        :key="tracker.id"
        class="rounded-lg border border-line bg-surface p-3"
      >
        <div v-if="editingId === tracker.id" class="flex items-center gap-1">
          <AppInput v-model="editLabel" class="flex-1 text-xs" @keyup.enter="confirmEdit(tracker.id)" @keyup.escape="cancelEdit" />
          <button type="button" class="text-fg-muted hover:text-fg" @click="confirmEdit(tracker.id)">
            <Check class="h-3.5 w-3.5" />
          </button>
          <button type="button" class="text-fg-muted hover:text-fg" @click="cancelEdit">
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
        <div v-else class="flex items-center justify-between gap-1">
          <span class="truncate text-xs text-fg-muted">{{ tracker.label }}</span>
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="text-fg-muted hover:text-fg" @click="startEdit(tracker.id, tracker.label)">
              <Pencil class="h-3 w-3" />
            </button>
            <button type="button" class="text-fg-muted hover:text-danger" @click="store.deleteTracker(tracker.id)">
              <Trash2 class="h-3 w-3" />
            </button>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-2">
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
      </div>

      <p v-if="store.trackers.length === 0" class="text-xs text-fg-muted">
        {{ $t('commands.trackers.empty') }}
      </p>
    </div>

    <div class="flex gap-2">
      <AppInput
        v-model="newLabel"
        :placeholder="$t('commands.trackers.placeholder')"
        class="flex-1 text-xs"
        @keyup.enter="addTracker"
      />
      <AppButton size="sm" variant="ghost" :disabled="!newLabel.trim()" @click="addTracker">
        <template #icon><Plus class="h-3.5 w-3.5" /></template>
      </AppButton>
    </div>
  </aside>
</template>
