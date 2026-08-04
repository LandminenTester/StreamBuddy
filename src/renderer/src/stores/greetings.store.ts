import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GreetingBlacklistEntry } from '@shared/types/loyalty'

export const useGreetingsStore = defineStore('greetings', () => {
  const blacklist = ref<GreetingBlacklistEntry[]>([])
  const knownBots = ref<string[]>([])

  async function fetchBlacklist(): Promise<void> {
    blacklist.value = await window.api.invoke('greetings:listBlacklist', undefined)
  }

  async function setBlacklisted(userLogin: string, blacklisted: boolean): Promise<void> {
    blacklist.value = await window.api.invoke('greetings:setBlacklisted', {
      userLogin,
      blacklisted
    })
  }

  async function fetchKnownBots(): Promise<void> {
    knownBots.value = await window.api.invoke('greetings:listKnownBots', undefined)
  }

  async function blacklistKnownBots(): Promise<void> {
    blacklist.value = await window.api.invoke('greetings:blacklistKnownBots', undefined)
  }

  return {
    blacklist,
    knownBots,
    fetchBlacklist,
    setBlacklisted,
    fetchKnownBots,
    blacklistKnownBots
  }
})
