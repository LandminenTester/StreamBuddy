<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Copy, Eye, EyeOff, Pencil, Play, Plus, Trash2, Volume2, VolumeX } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppSelect, { type SelectOption } from '@renderer/components/ui/AppSelect.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import AlertRuleFormModal from './AlertRuleFormModal.vue'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import { emptyAlertRuleForm, type AlertRuleFormState } from './types'
import { conditionLabel, eventTypeLabelKey, SUB_TIERS, usedSubTiers } from './utils'
import type { AlertRule, AlertRuleEventType, AlertRuleInput } from '@shared/types/alertRule'

const { t } = useI18n()
const store = useAlertsStore()

const isModalOpen = ref(false)
const activeForm = ref<AlertRuleFormState>(emptyAlertRuleForm('follow', null))
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const deleteTarget = ref<AlertRule | null>(null)

const isUrlVisible = ref(false)
const justCopied = ref(false)

const isPickerOpen = ref(false)
const pickerEventType = ref<AlertRuleEventType>('follow')
const pickerSubTier = ref<string>('')
const pickerThreshold = ref<string>('1')

onMounted(async () => {
  await Promise.all([store.fetchAlertRules(), store.fetchServerPort(), store.fetchMuted()])
})

const eventTypeOptions: SelectOption[] = [
  { value: 'follow', label: t('alerts.manager.events.follow') },
  { value: 'sub', label: t('alerts.manager.events.sub') },
  { value: 'gift_sub', label: t('alerts.manager.events.gift_sub') },
  { value: 'raid', label: t('alerts.manager.events.raid') }
]

const availableSubTierOptions = computed<SelectOption[]>(() => {
  const used = usedSubTiers(store.rules)
  return SUB_TIERS.filter((tier) => !used.has(tier)).map((tier) => ({
    value: tier,
    label: t(`alerts.manager.tiers.${tier}`)
  }))
})

function openPicker(): void {
  pickerEventType.value = 'follow'
  pickerSubTier.value = availableSubTierOptions.value[0]?.value ?? ''
  pickerThreshold.value = '1'
  isPickerOpen.value = true
}

function confirmPicker(): void {
  const condition =
    pickerEventType.value === 'follow'
      ? null
      : pickerEventType.value === 'sub'
        ? pickerSubTier.value
        : pickerThreshold.value
  activeForm.value = emptyAlertRuleForm(pickerEventType.value, condition)
  saveError.value = null
  isPickerOpen.value = false
  isModalOpen.value = true
}

function openEditModal(rule: AlertRule): void {
  activeForm.value = {
    id: rule.id,
    eventType: rule.eventType,
    condition: rule.condition,
    media: { ...rule.media },
    audio: { ...rule.audio },
    text: { ...rule.text },
    effectId: rule.effectId,
    enabled: rule.enabled
  }
  saveError.value = null
  isModalOpen.value = true
}

async function handleSubmit(form: AlertRuleFormState): Promise<void> {
  isSaving.value = true
  saveError.value = null
  const input: AlertRuleInput = {
    eventType: form.eventType,
    condition: form.condition,
    media: form.media,
    audio: form.audio,
    text: form.text,
    effectId: form.effectId,
    enabled: form.enabled
  }
  try {
    if (form.id) {
      await store.updateAlertRule(form.id, input)
    } else {
      await store.createAlertRule(input)
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
  await store.deleteAlertRule(deleteTarget.value.id)
  deleteTarget.value = null
}

async function toggleEnabled(rule: AlertRule): Promise<void> {
  await store.updateAlertRule(rule.id, { enabled: !rule.enabled })
}

async function testRule(rule: AlertRule): Promise<void> {
  await store.testAlertRule(rule.id)
}

async function toggleMute(): Promise<void> {
  await store.setMuted(!store.isMuted)
}

async function copyOverlayUrl(): Promise<void> {
  await navigator.clipboard.writeText(store.alertsOverlayUrl)
  justCopied.value = true
  setTimeout(() => {
    justCopied.value = false
  }, 2000)
}

const columns = computed<DataTableColumn[]>(() => [
  { key: 'event', label: t('alerts.manager.columns.event') },
  { key: 'condition', label: t('alerts.manager.columns.condition') },
  { key: 'enabled', label: t('alerts.manager.columns.enabled') },
  { key: 'actions', label: t('alerts.manager.columns.actions'), align: 'right' }
])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div class="flex items-center gap-1.5">
        <span class="font-mono text-xs text-fg-muted">
          {{ isUrlVisible ? store.alertsOverlayUrl : '••••••••••••••' }}
        </span>
        <button
          type="button"
          class="shrink-0 rounded p-1 text-fg-subtle transition-colors hover:text-fg"
          :aria-label="isUrlVisible ? $t('alerts.hideUrl') : $t('alerts.showUrl')"
          @click="isUrlVisible = !isUrlVisible"
        >
          <EyeOff v-if="isUrlVisible" class="h-3.5 w-3.5" />
          <Eye v-else class="h-3.5 w-3.5" />
        </button>
        <AppButton size="sm" variant="ghost" :disabled="!store.serverPort" @click="copyOverlayUrl">
          <template #icon><Copy class="h-3.5 w-3.5" /></template>
          {{ justCopied ? $t('alerts.copied') : $t('alerts.copyUrl') }}
        </AppButton>
      </div>

      <div class="flex items-center gap-2">
        <AppButton size="sm" variant="ghost" @click="store.clearAlertQueue()">
          {{ $t('alerts.manager.clearQueue') }}
        </AppButton>
        <AppButton size="sm" :variant="store.isMuted ? 'danger' : 'ghost'" @click="toggleMute">
          <template #icon>
            <VolumeX v-if="store.isMuted" class="h-3.5 w-3.5" />
            <Volume2 v-else class="h-3.5 w-3.5" />
          </template>
          {{ store.isMuted ? $t('alerts.manager.unmute') : $t('alerts.manager.mute') }}
        </AppButton>
        <AppButton variant="primary" @click="openPicker">
          <template #icon><Plus class="h-4 w-4" /></template>
          {{ $t('alerts.manager.new') }}
        </AppButton>
      </div>
    </div>

    <DataTable :columns="columns" :rows="store.rules" :row-key="(row: AlertRule) => row.id">
      <template #empty>
        <EmptyState :title="$t('alerts.manager.empty')" :description="$t('alerts.manager.emptyHint')" />
      </template>

      <template #event="{ row }">
        {{ $t(eventTypeLabelKey((row as AlertRule).eventType)) }}
      </template>

      <template #condition="{ row }">
        {{ conditionLabel(row as AlertRule).startsWith('alerts.') ? $t(conditionLabel(row as AlertRule)) : conditionLabel(row as AlertRule) }}
      </template>

      <template #enabled="{ row }">
        <AppBadge :variant="(row as AlertRule).enabled ? 'success' : 'neutral'" dot>
          {{ (row as AlertRule).enabled ? $t('common.enabled') : $t('common.disabled') }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <AppButton size="sm" variant="ghost" @click="testRule(row as AlertRule)">
            <template #icon><Play class="h-3.5 w-3.5" /></template>
            {{ $t('alerts.manager.test') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="toggleEnabled(row as AlertRule)">
            {{ (row as AlertRule).enabled ? $t('common.disabled') : $t('common.enabled') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="openEditModal(row as AlertRule)">
            <template #icon><Pencil class="h-3.5 w-3.5" /></template>
            {{ $t('common.edit') }}
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="deleteTarget = row as AlertRule">
            <template #icon><Trash2 class="h-3.5 w-3.5" /></template>
            {{ $t('common.delete') }}
          </AppButton>
        </div>
      </template>
    </DataTable>
  </div>

  <BaseModal v-if="isPickerOpen" :title="$t('alerts.manager.new')" max-width="max-w-md" @close="isPickerOpen = false">
    <div class="space-y-4">
      <AppSelect v-model="pickerEventType" :label="$t('alerts.manager.form.eventType')" :options="eventTypeOptions" />
      <AppSelect
        v-if="pickerEventType === 'sub'"
        v-model="pickerSubTier"
        :label="$t('alerts.manager.form.condition')"
        :options="availableSubTierOptions"
      />
      <div v-else-if="pickerEventType === 'gift_sub' || pickerEventType === 'raid'">
        <label class="mb-1.5 block text-xs font-medium text-fg-muted">
          {{ pickerEventType === 'gift_sub' ? $t('alerts.manager.condition.giftSubLabel') : $t('alerts.manager.condition.raidLabel') }}
        </label>
        <input
          v-model="pickerThreshold"
          type="number"
          min="1"
          class="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          :placeholder="$t('alerts.manager.condition.thresholdPlaceholder')"
        />
      </div>
    </div>
    <template #footer>
      <AppButton variant="ghost" @click="isPickerOpen = false">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="confirmPicker">{{ $t('common.next') }}</AppButton>
    </template>
  </BaseModal>

  <AlertRuleFormModal
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
    :message="$t(eventTypeLabelKey(deleteTarget.eventType))"
    :confirm-label="$t('common.delete')"
    @confirm="confirmDelete"
    @close="deleteTarget = null"
  />
</template>
