<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppTextarea from '@renderer/components/ui/AppTextarea.vue'
import AppField from '@renderer/components/ui/AppField.vue'
import AppSelect, { type SelectOption } from '@renderer/components/ui/AppSelect.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import TimelineEditor, { type TimelineLayerValue } from '@renderer/components/alerts/TimelineEditor.vue'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import { eventTypeLabelKey, placeholdersForEventType } from './utils'
import type { AlertRuleFormState } from './types'
import type { MediaType } from '@shared/types/alertRule'

const props = defineProps<{
  initial: AlertRuleFormState
  saving?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  submit: [form: AlertRuleFormState]
}>()

const { t } = useI18n()
const store = useAlertsStore()
const form = reactive<AlertRuleFormState>({
  ...props.initial,
  media: { ...props.initial.media },
  audio: { ...props.initial.audio },
  text: { ...props.initial.text }
})

onMounted(() => {
  if (store.effects.length === 0) void store.fetchEffects()
})

const mediaTypeOptions: SelectOption[] = [
  { value: 'video', label: t('alerts.manager.form.mediaType.video') },
  { value: 'gif', label: t('alerts.manager.form.mediaType.gif') },
  { value: 'image', label: t('alerts.manager.form.mediaType.image') }
]

const effectOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('alerts.manager.form.linkedEffectNone') },
  ...store.effects.map((effect) => ({ value: String(effect.id), label: effect.name }))
])

const selectedEffectId = computed<string>({
  get: () => (form.effectId !== null ? String(form.effectId) : ''),
  set: (value) => {
    form.effectId = value === '' ? null : Number(value)
  }
})

const mediaTypeModel = computed<string>({
  get: () => form.media.mediaType,
  set: (value) => {
    form.media.mediaType = value as MediaType
  }
})

const mediaTiming = computed<TimelineLayerValue>({
  get: () => ({
    startMs: form.media.startMs,
    durationMs: form.media.durationMs,
    fadeInMs: form.media.fadeInMs,
    fadeOutMs: form.media.fadeOutMs
  }),
  set: (value) => {
    form.media.startMs = value.startMs
    form.media.durationMs = value.durationMs
    form.media.fadeInMs = value.fadeInMs ?? 0
    form.media.fadeOutMs = value.fadeOutMs ?? 0
  }
})

const audioTiming = computed<TimelineLayerValue>({
  get: () => ({ startMs: form.audio.startMs, durationMs: form.audio.durationMs }),
  set: (value) => {
    form.audio.startMs = value.startMs
    form.audio.durationMs = value.durationMs
  }
})

const textTiming = computed<TimelineLayerValue>({
  get: () => ({
    startMs: form.text.startMs,
    durationMs: form.text.durationMs,
    fadeInMs: form.text.fadeInMs,
    fadeOutMs: form.text.fadeOutMs
  }),
  set: (value) => {
    form.text.startMs = value.startMs
    form.text.durationMs = value.durationMs
    form.text.fadeInMs = value.fadeInMs ?? 0
    form.text.fadeOutMs = value.fadeOutMs ?? 0
  }
})

const placeholders = computed(() => placeholdersForEventType(form.eventType))

async function pickMedia(): Promise<void> {
  const path = await store.pickManagerMediaFile()
  if (path) form.media.mediaPath = path
}

async function pickAudio(): Promise<void> {
  const path = await store.pickManagerAudioFile()
  if (path) form.audio.audioPath = path
}

function submit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id ? $t('alerts.manager.form.editTitle') : $t('alerts.manager.form.createTitle')"
    max-width="max-w-5xl"
    @close="emit('close')"
  >
    <div class="space-y-6">
      <p class="text-sm text-fg-muted">
        {{ $t(eventTypeLabelKey(form.eventType)) }}
        <template v-if="form.condition"> — {{ form.condition }}</template>
      </p>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-fg">{{ $t('alerts.manager.form.mediaSection') }}</h3>
        <AppSelect v-model="mediaTypeModel" :label="$t('alerts.manager.form.mediaTypeLabel')" :options="mediaTypeOptions" />
        <AppField field-id="rule-media-file" :label="$t('alerts.manager.form.mediaFile')">
          <div class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-sm text-fg-muted">
              {{ form.media.mediaPath ?? $t('alerts.manager.form.noMediaFile') }}
            </span>
            <AppButton size="sm" variant="ghost" @click="pickMedia">
              <template #icon><FolderOpen class="h-3.5 w-3.5" /></template>
              {{ $t('alerts.manager.form.chooseMedia') }}
            </AppButton>
          </div>
        </AppField>
        <TimelineEditor v-model="mediaTiming" :label="$t('alerts.manager.timeline.mediaTrack')" :show-fades="true" />
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-fg">{{ $t('alerts.manager.form.audioSection') }}</h3>
        <AppField field-id="rule-audio-file" :label="$t('alerts.manager.form.audioFile')">
          <div class="flex items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-sm text-fg-muted">
              {{ form.audio.audioPath ?? $t('alerts.manager.form.noAudioFile') }}
            </span>
            <AppButton size="sm" variant="ghost" @click="pickAudio">
              <template #icon><FolderOpen class="h-3.5 w-3.5" /></template>
              {{ $t('alerts.manager.form.chooseAudio') }}
            </AppButton>
          </div>
        </AppField>
        <AppField field-id="rule-audio-volume" :label="`${$t('alerts.manager.form.volume')}: ${form.audio.volume}%`">
          <input id="rule-audio-volume" v-model.number="form.audio.volume" type="range" min="0" max="100" class="w-full accent-accent" />
        </AppField>
        <TimelineEditor v-model="audioTiming" :label="$t('alerts.manager.timeline.audioTrack')" :show-fades="false" />
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-fg">{{ $t('alerts.manager.form.textSection') }}</h3>
        <AppField field-id="rule-text-template" :label="$t('alerts.manager.form.textTemplate')">
          <AppTextarea
            id="rule-text-template"
            v-model="form.text.template"
            :placeholder="$t('alerts.manager.form.textTemplatePlaceholder')"
          />
        </AppField>
        <p class="text-xs text-fg-subtle">
          {{ $t('alerts.manager.form.placeholdersHint') }} {{ placeholders.join(' ') }}
        </p>
        <TimelineEditor v-model="textTiming" :label="$t('alerts.manager.timeline.textTrack')" :show-fades="true" />
      </section>

      <AppSelect v-model="selectedEffectId" :label="$t('alerts.manager.form.linkedEffect')" :options="effectOptions" />

      <AppToggle v-model="form.enabled" :label="$t('alerts.manager.form.enabled')" />

      <p v-if="props.error" class="text-sm text-danger">{{ props.error }}</p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton variant="primary" :loading="props.saving" @click="submit">
        {{ $t('common.save') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
