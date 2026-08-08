<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clapperboard, Copy, Eye, EyeOff, Pencil, Play, Plus, Trash2 } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import EffectFormModal, { type EffectFormState } from './EffectFormModal.vue'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import type { Effect } from '@shared/types/alert'

const { t } = useI18n()
const store = useAlertsStore()

const isModalOpen = ref(false)
const activeForm = ref<EffectFormState>(emptyForm())
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const deleteTarget = ref<Effect | null>(null)

const visibleUrls = ref(new Set<number>())
const justCopied = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([store.fetchEffects(), store.fetchServerPort()])
})

function emptyForm(): EffectFormState {
  return { id: null, name: '', videoPath: null, audioPath: null, width: 1920, height: 1080, volume: 100 }
}

function openCreateModal(): void {
  activeForm.value = emptyForm()
  saveError.value = null
  isModalOpen.value = true
}

function openEditModal(effect: Effect): void {
  activeForm.value = {
    id: effect.id,
    name: effect.name,
    videoPath: effect.videoPath,
    audioPath: effect.audioPath,
    width: effect.width,
    height: effect.height,
    volume: effect.volume
  }
  saveError.value = null
  isModalOpen.value = true
}

async function handleSubmit(form: EffectFormState): Promise<void> {
  isSaving.value = true
  saveError.value = null
  try {
    if (form.id) {
      await store.updateEffect(form.id, {
        name: form.name,
        videoPath: form.videoPath,
        audioPath: form.audioPath,
        width: form.width,
        height: form.height,
        volume: form.volume
      })
    } else {
      await store.createEffect({
        name: form.name,
        videoPath: form.videoPath,
        audioPath: form.audioPath,
        width: form.width,
        height: form.height,
        volume: form.volume
      })
    }
    isModalOpen.value = false
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : String(err)
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  await store.deleteEffect(deleteTarget.value.id)
  deleteTarget.value = null
}

function toggleUrl(id: number): void {
  if (visibleUrls.value.has(id)) {
    visibleUrls.value.delete(id)
  } else {
    visibleUrls.value.add(id)
  }
}

async function copyUrl(effect: Effect): Promise<void> {
  await navigator.clipboard.writeText(store.overlayUrl(effect.id))
  justCopied.value = effect.id
  setTimeout(() => {
    justCopied.value = null
  }, 2000)
}

async function testEffect(effect: Effect): Promise<void> {
  await store.triggerEffect(effect.id)
}

const columns = computed<DataTableColumn[]>(() => [
  { key: 'name', label: t('alerts.columns.name') },
  { key: 'size', label: t('alerts.columns.size') },
  { key: 'url', label: t('alerts.columns.url') },
  { key: 'actions', label: t('alerts.columns.actions'), align: 'right' }
])
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8">
    <div class="flex justify-end">
      <AppButton variant="primary" @click="openCreateModal">
        <template #icon><Plus class="h-4 w-4" /></template>
        {{ $t('alerts.new') }}
      </AppButton>
    </div>

    <DataTable
      :columns="columns"
      :rows="store.effects"
      :row-key="(row: Effect) => row.id"
    >
      <template #empty>
        <EmptyState
          :title="$t('alerts.empty')"
          :description="$t('alerts.emptyHint')"
          :icon="Clapperboard"
        />
      </template>

      <template #size="{ row }">
        <span class="text-sm text-fg-muted">{{ (row as Effect).width }} × {{ (row as Effect).height }}</span>
      </template>

      <template #url="{ row }">
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs text-fg-muted">
            {{ visibleUrls.has((row as Effect).id) ? store.overlayUrl((row as Effect).id) : '••••••••••••••' }}
          </span>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-fg-subtle transition-colors hover:text-fg"
            :aria-label="visibleUrls.has((row as Effect).id) ? $t('alerts.hideUrl') : $t('alerts.showUrl')"
            @click="toggleUrl((row as Effect).id)"
          >
            <EyeOff v-if="visibleUrls.has((row as Effect).id)" class="h-3.5 w-3.5" />
            <Eye v-else class="h-3.5 w-3.5" />
          </button>
          <AppButton
            size="sm"
            variant="ghost"
            :disabled="!store.serverPort"
            @click="copyUrl(row as Effect)"
          >
            <template #icon><Copy class="h-3.5 w-3.5" /></template>
            {{ justCopied === (row as Effect).id ? $t('alerts.copied') : $t('alerts.copyUrl') }}
          </AppButton>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <AppButton
            size="sm"
            variant="ghost"
            :title="$t('alerts.test')"
            @click="testEffect(row as Effect)"
          >
            <template #icon><Play class="h-3.5 w-3.5" /></template>
            {{ $t('alerts.test') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="openEditModal(row as Effect)">
            <template #icon><Pencil class="h-3.5 w-3.5" /></template>
            {{ $t('common.edit') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="deleteTarget = row as Effect">
            <template #icon><Trash2 class="h-3.5 w-3.5" /></template>
            {{ $t('common.delete') }}
          </AppButton>
        </div>
      </template>
    </DataTable>
  </div>

  <EffectFormModal
    v-if="isModalOpen"
    :initial="activeForm"
    :saving="isSaving"
    :error="saveError"
    @close="isModalOpen = false"
    @submit="handleSubmit"
  />

  <ConfirmModal
    v-if="deleteTarget"
    :title="$t('common.delete')"
    :message="`${deleteTarget.name}`"
    :confirm-label="$t('common.delete')"
    @confirm="confirmDelete"
    @close="deleteTarget = null"
  />
</template>
