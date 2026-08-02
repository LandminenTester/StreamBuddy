<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import ResponseTextEditor from './ResponseTextEditor.vue'
import type { CommandFormState } from '@renderer/views/commands/types'
import { deliveryModeOptions, permissionOptions } from '@renderer/views/commands/utils'
import { useTrackersStore } from '@renderer/stores/trackers.store'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'

const props = defineProps<{ initial: CommandFormState }>()
const emit = defineEmits<{ close: []; submit: [form: CommandFormState] }>()

const form = reactive<CommandFormState>({ ...props.initial })
const trackersStore = useTrackersStore()

onMounted(() => {
  if (trackersStore.trackers.length === 0) void trackersStore.fetchTrackers()
})

const trackerOptions = computed<SelectOption[]>(() => [
  { value: '', label: '—' },
  ...trackersStore.trackers.map((t) => ({ value: String(t.id), label: t.label }))
])

const selectedTrackerId = computed({
  get: () => (form.trackerId === null ? '' : String(form.trackerId)),
  set: (value: string) => {
    form.trackerId = value ? Number(value) : null
    if (!value) form.trackerAction = null
    else if (trackersStore.trackers.find((t) => t.id === Number(value))?.type === 'counter') {
      if (!form.trackerAction) form.trackerAction = 'increment'
    } else {
      form.trackerAction = null
    }
  }
})

const trackerActionOptions = computed<SelectOption[]>(() => [
  { value: 'increment', label: '+1 (Inkrementieren)' },
  { value: 'decrement', label: '−1 (Dekrementieren)' }
])

const selectedTrackerAction = computed({
  get: () => form.trackerAction ?? 'increment',
  set: (value: string) => {
    form.trackerAction = value === 'increment' || value === 'decrement' ? value : null
  }
})

const linkedTrackerType = computed(() => {
  if (!form.trackerId) return null
  return trackersStore.trackers.find((t) => t.id === form.trackerId)?.type ?? null
})

const linkedTracker = computed(() => {
  if (!form.trackerId) return null
  return trackersStore.trackers.find((t) => t.id === form.trackerId) ?? null
})

watch(linkedTrackerType, (type) => {
  if (type !== 'counter') form.trackerAction = null
  else if (!form.trackerAction) form.trackerAction = 'increment'
})
</script>

<template>
  <BaseModal
    :title="form.id === null ? $t('commands.new') : $t('commands.edit')"
    max-width="max-w-4xl"
    @close="emit('close')"
  >
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
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
          :linked-tracker="linkedTracker"
          :linked-tracker-action="form.trackerAction"
        />
      </div>

      <div class="space-y-4 lg:border-l lg:border-line lg:pl-6">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <AppSelect
            v-model="form.deliveryMode"
            :label="$t('commands.form.delivery')"
            :options="deliveryModeOptions()"
            :hint="form.deliveryMode === 'whisper' ? $t('commands.form.whisperWarning') : undefined"
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

        <div class="border-t border-line pt-4">
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
            {{ $t('commands.werte.formSection') }}
          </p>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <AppSelect
              v-model="selectedTrackerId"
              :label="$t('commands.werte.selectLabel')"
              :options="trackerOptions"
            />
            <AppSelect
              v-if="linkedTrackerType === 'counter'"
              v-model="selectedTrackerAction"
              :label="$t('commands.werte.actionLabel')"
              :options="trackerActionOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" @click="emit('submit', { ...form })">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
