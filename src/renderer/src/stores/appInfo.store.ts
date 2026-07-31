import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChangelogEntry, UpdateStatus } from '@shared/types/appInfo'

export const useAppInfoStore = defineStore('appInfo', () => {
  const version = ref('')
  const changelog = ref<ChangelogEntry[]>([])
  const updateStatus = ref<UpdateStatus>({ state: 'idle' })

  async function fetchVersion(): Promise<void> {
    version.value = await window.api.invoke('app:getVersion', undefined)
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
    changelog,
    updateStatus,
    fetchVersion,
    fetchChangelog,
    checkForUpdate,
    installUpdate,
    subscribeToUpdateStatus
  }
})
