<script setup lang="ts">
import { computed } from 'vue'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import AppButton from '@renderer/components/ui/AppButton.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import ChangelogList from './ChangelogList.vue'
import { updateStatusLabel } from './appUpdateStatus'

const emit = defineEmits<{ close: [] }>()
const appInfoStore = useAppInfoStore()

const newVersionEntry = computed(() => {
  const version = appInfoStore.updateStatus.version
  if (!version) return null
  return appInfoStore.changelog.find((entry) => entry.version === version) ?? null
})
</script>

<template>
  <BaseModal :title="$t('update.availableTitle')" max-width="max-w-2xl" @close="emit('close')">
    <div class="space-y-5">
      <div>
        <p class="text-sm text-fg">
          {{ $t('update.availableBody', { version: appInfoStore.updateStatus.version }) }}
        </p>
        <p class="mt-1 text-xs text-fg-muted">
          {{ updateStatusLabel(appInfoStore.updateStatus) }}
        </p>
      </div>

      <div v-if="newVersionEntry" class="custom-scrollbar max-h-72 overflow-y-auto pr-1">
        <ChangelogList :entries="[newVersionEntry]" />
      </div>
      <p v-else class="text-xs text-fg-muted">{{ $t('update.changelogLoading') }}</p>

      <p v-if="appInfoStore.updateStatus.state === 'downloaded'" class="text-xs text-warning">
        {{ $t('update.restartWarning') }}
      </p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('close')">{{ $t('update.later') }}</AppButton>
      <AppButton
        v-if="appInfoStore.updateStatus.state === 'downloaded'"
        variant="primary"
        @click="appInfoStore.installUpdate()"
      >
        {{ $t('update.installAndRestart') }}
      </AppButton>
    </template>
  </BaseModal>
</template>
