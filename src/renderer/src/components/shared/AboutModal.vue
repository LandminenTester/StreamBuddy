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
    { key: 'author', label: t('update.author'), value: metadata.author },
    { key: 'license', label: t('update.license'), value: metadata.license }
  ]
  if (metadata.repositoryUrl) {
    items.push({ key: 'repository', label: t('update.repository') })
  }
  return items
})
</script>

<template>
  <BaseModal :title="$t('nav.about')" max-width="max-w-2xl" @close="emit('close')">
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="font-medium text-fg">
            {{ $t('update.version') }} {{ appInfoStore.version || '–' }}
          </p>
          <p class="mt-1 text-xs text-fg-muted">
            {{ updateStatusLabel(appInfoStore.updateStatus) }}
          </p>
        </div>
        <AppButton
          v-if="appInfoStore.updateStatus.state === 'downloaded'"
          variant="primary"
          size="sm"
          @click="appInfoStore.installUpdate()"
        >
          {{ $t('update.install') }}
        </AppButton>
        <AppButton
          v-else
          size="sm"
          :disabled="appInfoStore.updateStatus.state === 'checking'"
          @click="appInfoStore.checkForUpdate()"
        >
          {{ $t('settings.general.checkForUpdate') }}
        </AppButton>
      </div>

      <p v-if="appInfoStore.updateStatus.state === 'downloaded'" class="text-xs text-warning">
        {{ $t('update.restartWarning') }}
      </p>

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

      <div class="border-t border-line pt-5">
        <p class="mb-3 text-sm font-medium text-fg">{{ $t('update.changelog') }}</p>
        <div class="custom-scrollbar max-h-80 overflow-y-auto pr-1">
          <ChangelogList :entries="appInfoStore.changelog" />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
