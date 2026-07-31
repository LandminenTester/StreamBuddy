<script setup lang="ts">
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import BaseModal from './BaseModal.vue'
import ChangelogList from './ChangelogList.vue'
import { updateStatusLabel } from './appUpdateStatus'

const emit = defineEmits<{ close: [] }>()
const appInfoStore = useAppInfoStore()

function handleCheckForUpdate(): void {
  void appInfoStore.checkForUpdate()
}

function handleInstallUpdate(): void {
  void appInfoStore.installUpdate()
}
</script>

<template>
  <BaseModal title="Über StreamerBot" max-width="max-w-2xl" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="font-medium">Version {{ appInfoStore.version || '–' }}</p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ updateStatusLabel(appInfoStore.updateStatus) }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            v-if="appInfoStore.updateStatus.state === 'downloaded'"
            class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            @click="handleInstallUpdate"
          >
            Jetzt installieren
          </button>
          <button
            v-else
            class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            :disabled="appInfoStore.updateStatus.state === 'checking'"
            @click="handleCheckForUpdate"
          >
            Nach Updates suchen
          </button>
        </div>
      </div>
      <p
        v-if="appInfoStore.updateStatus.state === 'downloaded'"
        class="text-xs text-amber-600 dark:text-amber-400"
      >
        Die App wird beim Installieren beendet und neu gestartet -- nicht während eines laufenden
        Streams ausführen.
      </p>

      <dl
        v-if="appInfoStore.metadata"
        class="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800"
      >
        <dt class="text-slate-500 dark:text-slate-400">Ersteller</dt>
        <dd>{{ appInfoStore.metadata.author }}</dd>
        <dt class="text-slate-500 dark:text-slate-400">Lizenz</dt>
        <dd>{{ appInfoStore.metadata.license }}</dd>
        <template v-if="appInfoStore.metadata.repositoryUrl">
          <dt class="text-slate-500 dark:text-slate-400">Repository</dt>
          <dd class="min-w-0 break-all">
            <a
              :href="appInfoStore.metadata.repositoryUrl"
              target="_blank"
              rel="noopener"
              class="text-twitch-purple underline"
            >
              {{ appInfoStore.metadata.repositoryUrl.replace('https://', '') }}
            </a>
          </dd>
        </template>
      </dl>

      <div class="border-t border-slate-100 pt-3 dark:border-slate-800">
        <p class="mb-2 text-sm font-medium">Changelog</p>
        <div class="custom-scrollbar max-h-80 overflow-y-auto pr-1">
          <ChangelogList :entries="appInfoStore.changelog" />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
