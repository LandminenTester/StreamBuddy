<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppField from '@renderer/components/ui/AppField.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import { useAlertsStore } from '@renderer/stores/alerts.store'

export interface EffectFormState {
  id: number | null
  name: string
  videoPath: string | null
  audioPath: string | null
  width: number
  height: number
  volume: number
}

const props = defineProps<{
  initial: EffectFormState
  saving?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  close: []
  submit: [form: EffectFormState]
}>()

useI18n()
const store = useAlertsStore()
const form = reactive<EffectFormState>({ ...props.initial })

async function pickVideo(): Promise<void> {
  const path = await store.pickVideoFile()
  if (path) form.videoPath = path
}

async function pickAudio(): Promise<void> {
  const path = await store.pickAudioFile()
  if (path) form.audioPath = path
}

function submit(): void {
  emit('submit', { ...form })
}
</script>

<template>
  <BaseModal
    :title="form.id ? $t('alerts.form.editTitle') : $t('alerts.form.createTitle')"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <AppField field-id="effect-name" :label="$t('alerts.form.name')">
        <AppInput id="effect-name" v-model="form.name" :placeholder="$t('alerts.form.namePlaceholder')" />
      </AppField>

      <AppField field-id="effect-video" :label="$t('alerts.form.videoFile')">
        <div class="flex items-center gap-2">
          <span class="min-w-0 flex-1 truncate text-sm text-fg-muted">
            {{ form.videoPath ?? $t('alerts.form.noVideoFile') }}
          </span>
          <AppButton size="sm" variant="ghost" @click="pickVideo">
            <template #icon><FolderOpen class="h-3.5 w-3.5" /></template>
            {{ $t('alerts.form.chooseVideo') }}
          </AppButton>
        </div>
      </AppField>

      <AppField field-id="effect-audio" :label="$t('alerts.form.audioFile')">
        <div class="flex items-center gap-2">
          <span class="min-w-0 flex-1 truncate text-sm text-fg-muted">
            {{ form.audioPath ?? $t('alerts.form.noAudioFile') }}
          </span>
          <AppButton size="sm" variant="ghost" @click="pickAudio">
            <template #icon><FolderOpen class="h-3.5 w-3.5" /></template>
            {{ $t('alerts.form.chooseAudio') }}
          </AppButton>
        </div>
      </AppField>

      <AppField field-id="effect-volume" :label="`${$t('alerts.form.volume')}: ${form.volume}%`">
        <input
          id="effect-volume"
          v-model.number="form.volume"
          type="range"
          min="0"
          max="100"
          class="w-full accent-accent"
        />
      </AppField>

      <div class="grid grid-cols-2 gap-4">
        <AppField field-id="effect-width" :label="$t('alerts.form.width')">
          <AppInput id="effect-width" v-model.number="form.width" type="number" :min="1" />
        </AppField>
        <AppField field-id="effect-height" :label="$t('alerts.form.height')">
          <AppInput id="effect-height" v-model.number="form.height" type="number" :min="1" />
        </AppField>
      </div>

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
