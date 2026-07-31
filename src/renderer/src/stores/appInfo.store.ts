import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppMetadata, ChangelogEntry, UpdateStatus } from '@shared/types/appInfo'

export const useAppInfoStore = defineStore('appInfo', () => {
  const version = ref('')
  const metadata = ref<AppMetadata | null>(null)
  const changelog = ref<ChangelogEntry[]>([])
  const updateStatus = ref<UpdateStatus>({ state: 'idle' })

  async function fetchVersion(): Promise<void> {
    version.value = await window.api.invoke('app:getVersion', undefined)
  }

  async function fetchMetadata(): Promise<void> {
    metadata.value = await window.api.invoke('app:getMetadata', undefined)
  }

  async function fetchChangelog(): Promise<void> {
    changelog.value = await window.api.invoke('app:getChangelog', undefined)
  }

  async function checkForUpdate(): Promise<void> {
    await window.api.invoke('app:checkForUpdate', undefined)
  }

  async function installUpdate(): Promise<void> {
    await window.api.invoke('app:installUpdate', undefined)
  }

  function subscribeToUpdateStatus(): () => void {
    return window.api.on('app:onUpdateStatus', (status) => {
      updateStatus.value = status
    })
  }

  return {
    version,
    metadata,
    changelog,
    updateStatus,
    fetchVersion,
    fetchMetadata,
    fetchChangelog,
    checkForUpdate,
    installUpdate,
    subscribeToUpdateStatus
  }
})
