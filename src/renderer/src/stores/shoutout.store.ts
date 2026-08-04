import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShoutoutStore = defineStore('shoutout', () => {
  const autoShoutoutEnabled = ref(false)
  const isSaving = ref(false)

  async function fetchEnabled(): Promise<void> {
    autoShoutoutEnabled.value = await window.api.invoke('shoutout:getEnabled', undefined)
  }

  async function setEnabled(enabled: boolean): Promise<void> {
    isSaving.value = true
    try {
      autoShoutoutEnabled.value = await window.api.invoke('shoutout:setEnabled', { enabled })
    } finally {
      isSaving.value = false
    }
  }

  return { autoShoutoutEnabled, isSaving, fetchEnabled, setEnabled }
})
