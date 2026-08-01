<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import AppButton from '@renderer/components/ui/AppButton.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import ChangelogList from './ChangelogList.vue'
import { updateStatusLabel } from './appUpdateStatus'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const appInfoStore = useAppInfoStore()

const metadataItems = computed<DefinitionItem[]>(() => {
  const metadata = appInfoStore.metadata
  if (!metadata) return []
  const items: DefinitionItem[] = [
    { key: 'author', label: t('update.author'), value: metadata.author + " with ♥️ for TTV/ItsSemmel" },
    { key: 'license', label: t('update.license'), value: metadata.license }
  ]
  if (metadata.repositoryUrl) {
    items.push({ key: 'repository', label: t('update.repository') })
  }
  return items
})

const state = computed(() => appInfoStore.updateStatus.state)
const downloadPercent = computed(() => appInfoStore.updateStatus.percent ?? 0)
const updateVersion = computed(() => appInfoStore.updateStatus.version ?? '')
</script>

<template>
  <BaseModal :title="$t('nav.about')" max-width="max-w-2xl" @close="emit('close')">
    <div class="space-y-6">
      <!-- Version + Update-Status -->
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="font-medium text-fg">
            {{ $t('update.version') }} {{ appInfoStore.version || '–' }}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            {{ updateStatusLabel(appInfoStore.updateStatus) }}
          </p>
        </div>

        <!-- idle / not-available / error / checking -->
        <AppButton
          v-if="state === 'idle' || state === 'not-available' || state === 'error'"
          size="sm"
          @click="appInfoStore.checkForUpdate()"
        >
          {{ $t('settings.general.checkForUpdate') }}
        </AppButton>
        <AppButton v-else-if="state === 'checking'" size="sm" disabled>
          {{ $t('update.checking') }}
        </AppButton>
      </div>

      <!-- Update verfügbar: Banner + Download-Button -->
      <div v-if="state === 'available'" class="rounded-md bg-accent/10 p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-accent">
              {{ $t('update.availableBanner', { version: updateVersion }) }}
            </p>
            <p class="mt-0.5 text-xs text-fg-muted">{{ $t('update.availableBannerHint') }}</p>
          </div>
          <AppButton variant="primary" size="sm" @click="appInfoStore.downloadUpdate()">
            {{ $t('update.startDownload') }}
          </AppButton>
        </div>
      </div>

      <!-- Download läuft: Fortschrittsbalken -->
      <div v-if="state === 'downloading'" class="rounded-md bg-surface-subtle p-4">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-medium text-fg">{{ $t('update.downloadingTitle') }}</span>
          <span class="tabular-nums text-fg-muted">{{ downloadPercent }}%</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            class="h-full rounded-full bg-accent transition-all duration-300"
            :style="{ width: `${downloadPercent}%` }"
          />
        </div>
      </div>

      <!-- Heruntergeladen: Installieren-Button + Warnung -->
      <div v-if="state === 'downloaded'" class="space-y-3">
        <div class="flex items-center justify-between rounded-md bg-accent/10 p-4">
          <p class="font-semibold text-accent">
            {{ $t('update.downloadedBanner', { version: updateVersion }) }}
          </p>
          <AppButton variant="primary" size="sm" @click="appInfoStore.installUpdate()">
            {{ $t('update.install') }}
          </AppButton>
        </div>
        <p class="text-xs text-warning">{{ $t('update.restartWarning') }}</p>
      </div>

      <!-- Metadaten -->
      <div v-if="metadataItems.length > 0" class="border-t border-line pt-5">
        <DefinitionList :items="metadataItems">
          <template #repository>
            <a
              :href="appInfoStore.metadata!.repositoryUrl!"
              target="_blank"
              rel="noopener"
              class="break-all text-accent hover:underline"
            >
              {{ appInfoStore.metadata!.repositoryUrl!.replace('https://', '') }}
            </a>
          </template>
        </DefinitionList>
      </div>

      <!-- Changelog -->
      <div class="border-t border-line pt-5">
        <p class="mb-3 text-sm font-medium text-fg">{{ $t('update.changelog') }}</p>
        <div class="custom-scrollbar max-h-80 overflow-y-auto pr-1">
          <ChangelogList :entries="appInfoStore.changelog" />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
