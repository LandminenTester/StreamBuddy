<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen, Plus, Trash2 } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppField from '@renderer/components/ui/AppField.vue'
import AppSelect, { type SelectOption } from '@renderer/components/ui/AppSelect.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import TimelineEditor, { type TimelineLayerValue } from '@renderer/components/alerts/TimelineEditor.vue'
import PlaceholderTextarea from './PlaceholderTextarea.vue'
import { useAlertsStore } from '@renderer/stores/alerts.store'
import { eventTypeLabelKey, placeholdersForEventType } from './utils'
import type { AlertRuleFormState } from './types'
import type { MediaType } from '@shared/types/alertRule'

const TIMELINE_RANGE_MS = 15000
const GIFT_PLACEHOLDERS = ['{user}', '{subcount}']

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
  text:
    props.initial.eventType === 'sub'
      ? {
          ...props.initial.text,
          subTierTexts: (props.initial.text.subTierTexts ?? []).map((entry) => ({ ...entry })),
          subGiftThresholds: (props.initial.text.subGiftThresholds ?? []).map((entry) => ({ ...entry }))
        }
      : { ...props.initial.text }
})

const mediaNaturalDurationMs = ref<number | null>(null)
const audioNaturalDurationMs = ref<number | null>(null)

function probeDuration(path: string, kind: 'video' | 'audio'): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement(kind)
    el.preload = 'metadata'
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration * 1000 : null)
    el.onerror = () => resolve(null)
    el.src = `file://${path.replace(/\\/g, '/')}`
  })
}

onMounted(async () => {
  if (store.effects.length === 0) void store.fetchEffects()
  if (form.media.mediaPath && form.media.mediaType === 'video') {
    mediaNaturalDurationMs.value = await probeDuration(form.media.mediaPath, 'video')
  }
  if (form.audio.audioPath) {
    audioNaturalDurationMs.value = await probeDuration(form.audio.audioPath, 'audio')
  }
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
    if (value !== 'video') mediaNaturalDurationMs.value = null
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

const singleTemplate = computed<string>({
  get: () => form.text.template ?? '',
  set: (value) => {
    form.text.template = value
  }
})

const placeholders = computed(() => placeholdersForEventType(form.eventType))

const secondMarks = computed(() => {
  const count = Math.floor(TIMELINE_RANGE_MS / 1000)
  return Array.from({ length: count + 1 }, (_, i) => i)
})

function addGiftThreshold(): void {
  if (!form.text.subGiftThresholds) form.text.subGiftThresholds = []
  form.text.subGiftThresholds.push({ minAmount: 1, template: '' })
}

function removeGiftThreshold(index: number): void {
  form.text.subGiftThresholds?.splice(index, 1)
}

async function pickMedia(): Promise<void> {
  const path = await store.pickManagerMediaFile()
  if (!path) return
  form.media.mediaPath = path
  if (form.media.mediaType === 'video') {
    const duration = await probeDuration(path, 'video')
    mediaNaturalDurationMs.value = duration
    if (duration) form.media.durationMs = Math.min(duration, TIMELINE_RANGE_MS)
  }
}

async function pickAudio(): Promise<void> {
  const path = await store.pickManagerAudioFile()
  if (!path) return
  form.audio.audioPath = path
  const duration = await probeDuration(path, 'audio')
  audioNaturalDurationMs.value = duration
  if (duration) form.audio.durationMs = Math.min(duration, TIMELINE_RANGE_MS)
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
        <template v-if="form.eventType === 'raid' && form.condition"> — {{ form.condition }}+</template>
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
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-fg">{{ $t('alerts.manager.form.textSection') }}</h3>

        <template v-if="form.eventType === 'sub'">
          <div v-for="tierText in form.text.subTierTexts" :key="tierText.tier" class="space-y-1">
            <label class="block text-xs font-medium text-fg-muted">
              {{ $t(`alerts.manager.tiers.${tierText.tier}`) }}
            </label>
            <PlaceholderTextarea
              v-model="tierText.template"
              :placeholders="['{user}']"
              :placeholder="$t('alerts.manager.form.textTemplatePlaceholder')"
            />
          </div>

          <div class="space-y-2 rounded border border-line p-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-medium text-fg-muted">{{ $t('alerts.manager.form.subGiftThresholds') }}</h4>
              <AppButton size="sm" variant="ghost" @click="addGiftThreshold">
                <template #icon><Plus class="h-3.5 w-3.5" /></template>
                {{ $t('alerts.manager.form.addGiftThreshold') }}
              </AppButton>
            </div>
            <p v-if="!form.text.subGiftThresholds?.length" class="text-xs text-fg-subtle">
              {{ $t('alerts.manager.form.noGiftThresholds') }}
            </p>
            <div
              v-for="(threshold, index) in form.text.subGiftThresholds"
              :key="index"
              class="space-y-1.5 rounded border border-line p-2.5"
            >
              <div class="flex items-center gap-2">
                <input
                  v-model.number="threshold.minAmount"
                  type="number"
                  min="1"
                  class="w-24 rounded border border-line bg-surface px-2 py-1 text-sm"
                  :placeholder="$t('alerts.manager.condition.thresholdPlaceholder')"
                />
                <span class="text-xs text-fg-subtle">{{ $t('alerts.manager.form.giftThresholdAmount') }}</span>
                <button
                  type="button"
                  class="ml-auto rounded p-1 text-fg-muted transition-colors hover:text-danger"
                  :aria-label="$t('common.delete')"
                  @click="removeGiftThreshold(index)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
              <PlaceholderTextarea v-model="threshold.template" :placeholders="GIFT_PLACEHOLDERS" />
            </div>
          </div>
        </template>

        <PlaceholderTextarea
          v-else
          v-model="singleTemplate"
          :placeholders="placeholders"
          :placeholder="$t('alerts.manager.form.textTemplatePlaceholder')"
        />
      </section>

      <section class="space-y-2">
        <h3 class="text-sm font-semibold text-fg">{{ $t('alerts.manager.form.timelineSection') }}</h3>
        <div class="flex items-center gap-3">
          <span class="w-20 shrink-0"></span>
          <div class="relative h-4 flex-1">
            <span
              v-for="mark in secondMarks"
              :key="mark"
              class="absolute top-0 text-[10px] text-fg-subtle"
              :style="{ left: `${(mark * 1000 / TIMELINE_RANGE_MS) * 100}%` }"
            >
              {{ mark }}s
            </span>
          </div>
        </div>
        <div class="divide-y divide-line rounded border border-line">
          <div class="px-3 py-2">
            <TimelineEditor
              v-model="mediaTiming"
              :range-ms="TIMELINE_RANGE_MS"
              :label="$t('alerts.manager.timeline.mediaTrack')"
              :show-fades="true"
              :max-duration-ms="form.media.mediaType === 'video' ? (mediaNaturalDurationMs ?? undefined) : undefined"
            />
          </div>
          <div class="px-3 py-2">
            <TimelineEditor
              v-model="audioTiming"
              :range-ms="TIMELINE_RANGE_MS"
              :label="$t('alerts.manager.timeline.audioTrack')"
              :show-fades="false"
              :max-duration-ms="audioNaturalDurationMs ?? undefined"
            />
          </div>
          <div class="px-3 py-2">
            <TimelineEditor
              v-model="textTiming"
              :range-ms="TIMELINE_RANGE_MS"
              :label="$t('alerts.manager.timeline.textTrack')"
              :show-fades="true"
            />
          </div>
        </div>
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
