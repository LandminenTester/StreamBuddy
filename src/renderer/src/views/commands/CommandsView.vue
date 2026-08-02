<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageSquareText, Plus } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import { useCommandsStore } from '@renderer/stores/commands.store'
import { useTrackersStore } from '@renderer/stores/trackers.store'
import CommandFormModal from '@renderer/components/commands/CommandFormModal.vue'
import TrackerSidePanel from '@renderer/components/commands/TrackerSidePanel.vue'
import type { CommandFormState } from './types'
import { emptyCommandForm } from './types'
import { commandToFormState, permissionLabel } from './utils'
import { deleteCommandById, submitCommandForm } from './functions'
import type { Command } from '@shared/types/command'

const { t } = useI18n()
const store = useCommandsStore()
const trackersStore = useTrackersStore()
const isModalOpen = ref(false)
const activeForm = ref<CommandFormState>(emptyCommandForm())

onMounted(() => {
  void store.fetchCommands()
  void trackersStore.fetchTrackers()
})

const columns = computed<DataTableColumn[]>(() => [
  { key: 'trigger', label: t('commands.columns.trigger') },
  { key: 'permission', label: t('commands.columns.permission') },
  { key: 'cooldown', label: t('commands.columns.cooldown'), align: 'right' },
  { key: 'uses', label: t('commands.columns.uses'), align: 'right' },
  { key: 'status', label: t('commands.columns.status') },
  { key: 'actions', label: '', align: 'right' }
])

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
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <PageHeader :title="$t('commands.title')" :description="$t('commands.description')">
      <template #actions>
        <AppButton variant="primary" @click="openCreateModal">
          <template #icon><Plus class="h-4 w-4" /></template>
          {{ $t('commands.new') }}
        </AppButton>
      </template>
    </PageHeader>

    <div class="flex items-start gap-6">
      <div class="min-w-0 flex-1">
        <DataTable :columns="columns" :rows="store.commands" :row-key="(row: Command) => row.id">
          <template #empty>
            <EmptyState :title="$t('commands.empty')" :description="$t('commands.emptyHint')">
              <template #icon><MessageSquareText class="h-8 w-8" /></template>
              <template #action>
                <AppButton variant="primary" size="sm" @click="openCreateModal">
                  {{ $t('commands.new') }}
                </AppButton>
              </template>
            </EmptyState>
          </template>

          <template #trigger="{ row }">
            <code class="font-mono text-accent">{{ row.trigger }}</code>
          </template>
          <template #permission="{ row }">{{ permissionLabel(row.permissionLevel) }}</template>
          <template #cooldown="{ row }">
            <span class="tabular-nums">{{ row.cooldownSeconds }}s</span>
          </template>
          <template #uses="{ row }">
            <span class="tabular-nums">{{ row.useCount }}</span>
          </template>
          <template #status="{ row }">
            <AppBadge :variant="row.enabled ? 'success' : 'neutral'">
              {{ row.enabled ? $t('common.enabled') : $t('common.disabled') }}
            </AppBadge>
          </template>
          <template #actions="{ row }">
            <span class="flex items-center justify-end gap-1">
              <AppButton size="sm" variant="ghost" @click="openEditModal(row)">
                {{ $t('common.edit') }}
              </AppButton>
              <AppButton size="sm" variant="ghost" @click="deleteCommandById(store, row.id)">
                {{ $t('common.delete') }}
              </AppButton>
            </span>
          </template>
        </DataTable>
      </div>

      <TrackerSidePanel />
    </div>

    <CommandFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </div>
</template>
