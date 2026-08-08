<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppTabs from '@renderer/components/ui/AppTabs.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import ResponseTextEditor from './ResponseTextEditor.vue'
import PlaceholderHint from '@renderer/components/shared/PlaceholderHint.vue'
import type { CommandFormState } from '@renderer/views/commands/types'
import { deliveryModeOptions, permissionOptions } from '@renderer/views/commands/utils'
import { useTrackersStore } from '@renderer/stores/trackers.store'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'
import type { CommandTrackerAction, CommandTrackerActionType } from '@shared/types/command'

const props = defineProps<{ initial: CommandFormState; error?: string | null; saving?: boolean }>()
const emit = defineEmits<{ close: []; submit: [form: CommandFormState] }>()
const { t } = useI18n()

const form = reactive<CommandFormState>({ ...props.initial })
const trackersStore = useTrackersStore()
const alertsStore = useAlertsStore()
const activeTab = ref('response')

onMounted(() => {
  if (trackersStore.trackers.length === 0) void trackersStore.fetchTrackers()
  if (alertsStore.effects.length === 0) void alertsStore.fetchEffects()
})

const effectOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('commands.form.effectNone') },
  ...alertsStore.effects.map((effect) => ({ value: String(effect.id), label: effect.name }))
])

const selectedEffectId = computed<string>({
  get: () => (form.effectId === null ? '' : String(form.effectId)),
  set: (value: string) => {
    form.effectId = value ? Number(value) : null
  }
})

const tabs = computed(() => [
  { key: 'response', label: t('commands.form.responseTab') },
  { key: 'actions', label: t('commands.werte.actionsTab', { count: form.trackerActions.length }) }
])

const counterTrackers = computed(() =>
  trackersStore.trackers.filter((tracker) => tracker.type === 'counter')
)

const trackerActionOptions = computed<SelectOption[]>(() => [
  { value: 'increment', label: '+1 (Inkrementieren)' },
  { value: 'decrement', label: '-1 (Dekrementieren)' }
])

const canAddAction = computed(() => form.trackerActions.length < counterTrackers.value.length)

function actionTrackerOptions(currentTrackerId: number): SelectOption[] {
  const usedTrackerIds = new Set(
    form.trackerActions
      .map((action) => action.trackerId)
      .filter((trackerId) => trackerId !== currentTrackerId)
  )

  return counterTrackers.value
    .filter((tracker) => !usedTrackerIds.has(tracker.id))
    .map((tracker) => ({ value: String(tracker.id), label: tracker.label }))
}

function addTrackerAction(): void {
  const usedTrackerIds = new Set(form.trackerActions.map((action) => action.trackerId))
  const tracker = counterTrackers.value.find((candidate) => !usedTrackerIds.has(candidate.id))
  if (!tracker) return
  form.trackerActions = [...form.trackerActions, { trackerId: tracker.id, action: 'increment' }]
}

function updateTrackerAction(index: number, patch: Partial<CommandTrackerAction>): void {
  form.trackerActions = form.trackerActions.map((action, actionIndex) =>
    actionIndex === index ? { ...action, ...patch } : action
  )
}

function updateTrackerActionType(index: number, value: string): void {
  if (value !== 'increment' && value !== 'decrement') return
  updateTrackerAction(index, { action: value as CommandTrackerActionType })
}

function removeTrackerAction(index: number): void {
  form.trackerActions = form.trackerActions.filter((_, actionIndex) => actionIndex !== index)
}
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('commands.new') : $t('commands.edit')"
    max-width="max-w-4xl"
    @close="emit('close')"
  >
    <div class="space-y-5">
      <AppTabs :tabs="tabs" :model-value="activeTab" @update:model-value="activeTab = $event" />

      <div
        v-if="activeTab === 'response'"
        class="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]"
      >
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1fr)]">
            <AppInput
              v-model="form.trigger"
              :label="$t('commands.form.trigger')"
              :hint="$t('commands.form.triggerHint')"
              placeholder="!uptime"
              required
            />

            <AppInput
              v-model="form.aliasesInput"
              :label="$t('commands.form.aliases')"
              :hint="$t('commands.form.aliasesHint')"
              placeholder="!time, !howlong"
            />
          </div>

          <ResponseTextEditor
            v-model="form.response"
            :label="$t('commands.form.response')"
            :trackers="trackersStore.trackers"
            :tracker-actions="form.trackerActions"
          />
          <PlaceholderHint class="mt-3" />
        </div>

        <div class="space-y-4 lg:border-l lg:border-line lg:pl-6">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <AppSelect
              v-model="form.deliveryMode"
              :label="$t('commands.form.delivery')"
              :options="deliveryModeOptions()"
              :hint="
                form.deliveryMode === 'whisper' ? $t('commands.form.whisperWarning') : undefined
              "
            />

            <AppInput
              v-model="form.cooldownSeconds"
              type="number"
              :min="0"
              :label="$t('commands.form.cooldown')"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <AppSelect
              v-model="form.permissionLevel"
              :label="$t('commands.form.permission')"
              :options="permissionOptions()"
            />
            <div class="rounded border border-line px-3 py-2.5">
              <AppToggle v-model="form.enabled" :label="$t('commands.form.enabled')" />
            </div>
          </div>

          <AppSelect
            v-model="selectedEffectId"
            :label="$t('commands.form.effect')"
            :options="effectOptions"
          />
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-fg-muted">{{ $t('commands.werte.actionsHint') }}</p>
          <AppButton
            size="sm"
            variant="ghost"
            :disabled="!canAddAction"
            @click="addTrackerAction"
          >
            <template #icon><Plus class="h-3.5 w-3.5" /></template>
            {{ $t('commands.werte.addAction') }}
          </AppButton>
        </div>

        <div class="overflow-hidden rounded border border-line">
          <div
            class="hidden grid-cols-[minmax(0,1fr)_minmax(9rem,0.45fr)_2.5rem] gap-3 border-b border-line bg-surface-raised px-3 py-2 text-xs font-medium uppercase tracking-wide text-fg-muted sm:grid"
          >
            <span>{{ $t('commands.werte.selectLabel') }}</span>
            <span>{{ $t('commands.werte.actionLabel') }}</span>
            <span />
          </div>

          <div v-if="form.trackerActions.length === 0" class="px-3 py-6 text-center text-sm text-fg-muted">
            {{ $t('commands.werte.actionsEmpty') }}
          </div>

          <div
            v-for="(trackerAction, index) in form.trackerActions"
            :key="index"
            class="grid gap-3 border-b border-line px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.45fr)_2.5rem] sm:items-start"
          >
            <AppSelect
              :model-value="String(trackerAction.trackerId)"
              :options="actionTrackerOptions(trackerAction.trackerId)"
              @update:model-value="
                updateTrackerAction(index, { trackerId: Number($event) })
              "
            />
            <AppSelect
              :model-value="trackerAction.action"
              :options="trackerActionOptions"
              @update:model-value="updateTrackerActionType(index, $event)"
            />
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded border border-line text-fg-muted transition-colors hover:border-danger hover:text-danger"
              :aria-label="$t('common.delete')"
              @click="removeTrackerAction(index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <p v-if="error" class="mr-auto max-w-md text-left text-xs text-danger" role="alert">
        {{ error }}
      </p>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :loading="saving" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
