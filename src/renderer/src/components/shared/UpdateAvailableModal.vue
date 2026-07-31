<script setup lang="ts">
import { computed } from 'vue'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import BaseModal from './BaseModal.vue'
import ChangelogList from './ChangelogList.vue'
import { updateStatusLabel } from './appUpdateStatus'

const emit = defineEmits<{ close: [] }>()
const appInfoStore = useAppInfoStore()

const newVersionEntry = computed(() => {
  const version = appInfoStore.updateStatus.version
  if (!version) return null
  return appInfoStore.changelog.find((entry) => entry.version === version) ?? null
})

function handleInstallUpdate(): void {
  void appInfoStore.installUpdate()
}
</script>

<template>
  <BaseModal title="Update verfügbar" max-width="max-w-2xl" @close="emit('close')">
    <div class="space-y-4">
      <div>
        <p class="text-sm">
          Version
          <span class="font-medium">{{ appInfoStore.updateStatus.version }}</span>
          ist verfügbar.
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ updateStatusLabel(appInfoStore.updateStatus) }}
        </p>
      </div>

      <div v-if="newVersionEntry" class="custom-scrollbar max-h-72 overflow-y-auto pr-1">
        <ChangelogList :entries="[newVersionEntry]" />
      </div>
      <p v-else class="text-xs text-slate-500 dark:text-slate-400">
        Changelog für diese Version wird geladen…
      </p>

      <p
        v-if="appInfoStore.updateStatus.state === 'downloaded'"
        class="text-xs text-amber-600 dark:text-amber-400"
      >
        Die App wird beim Installieren beendet und neu gestartet -- nicht während eines laufenden
        Streams ausführen.
      </p>

      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          @click="emit('close')"
        >
          Später
        </button>
        <button
          v-if="appInfoStore.updateStatus.state === 'downloaded'"
          type="button"
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          @click="handleInstallUpdate"
        >
          Jetzt installieren & neu starten
        </button>
      </div>
    </div>
  </BaseModal>
</template>
