<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'
import type { FeatureKey } from '@shared/types/auth'
import { initSettings, onToggleFeature } from './functions'
import { labelForFeature } from './utils'

const authStore = useAuthStore()
const chatStore = useChatStore()
const channelInput = ref('')

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initSettings(authStore, chatStore)
  channelInput.value = chatStore.targetChannel
})

onUnmounted(() => {
  unsubscribe?.()
})

function handleToggle(featureKey: FeatureKey, event: Event): void {
  const enabled = (event.target as HTMLInputElement).checked
  void onToggleFeature(authStore, featureKey, enabled)
}

function handleSaveChannel(): void {
  if (!channelInput.value.trim()) return
  void chatStore.saveTargetChannel(channelInput.value.trim())
}
</script>

<template>
  <div class="max-w-2xl space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">Einstellungen</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Twitch-Bot-Verbindung und aktivierte Features.
      </p>
    </div>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Twitch-Verbindung
      </h2>

      <div class="mt-3 flex items-center justify-between">
        <div>
          <p v-if="authStore.status.connected" class="font-medium">
            Verbunden als
            <span class="text-twitch-purple">{{ authStore.status.twitchLogin }}</span>
          </p>
          <p v-else class="font-medium text-slate-500">Kein Bot-Account verbunden</p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Der Bot-Account sollte ein separater Twitch-Account sein, der als Moderator im Zielkanal
            eingesetzt ist.
          </p>
        </div>

        <button
          v-if="!authStore.status.connected"
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="authStore.isConnecting"
          @click="authStore.connect()"
        >
          {{ authStore.isConnecting ? 'Verbinde…' : 'Mit Twitch verbinden' }}
        </button>
        <button
          v-else
          class="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          @click="authStore.disconnect()"
        >
          Trennen
        </button>
      </div>

      <div
        v-if="authStore.status.missingScopes.length > 0"
        class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        <p>
          Für die aktivierten Features fehlen noch Berechtigungen:
          <code class="font-mono">{{ authStore.status.missingScopes.join(', ') }}</code>
        </p>
        <button
          class="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="authStore.isConnecting"
          @click="authStore.connect()"
        >
          Berechtigungen erweitern
        </button>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Chat-Verbindung</h2>

      <div class="mt-3 flex items-center gap-2">
        <input
          v-model="channelInput"
          type="text"
          placeholder="Twitch-Zielkanal, z.B. dein_channel_name"
          class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          class="rounded-md bg-twitch-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          :disabled="chatStore.isSaving || !channelInput.trim()"
          @click="handleSaveChannel"
        >
          Speichern
        </button>
      </div>

      <p class="mt-3 text-sm">
        Status:
        <span v-if="chatStore.status.connected" class="font-medium text-green-600">
          Verbunden mit #{{ chatStore.status.channel }}
        </span>
        <span v-else class="font-medium text-slate-500">
          Nicht verbunden
          <span v-if="chatStore.status.lastError">({{ chatStore.status.lastError }})</span>
        </span>
      </p>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Features</h2>

      <ul class="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        <li
          v-for="feature in authStore.features"
          :key="feature.featureKey"
          class="flex items-center justify-between py-3"
        >
          <div>
            <p class="font-medium">
              {{ labelForFeature(feature.featureKey)?.title ?? feature.featureKey }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ labelForFeature(feature.featureKey)?.description }}
            </p>
          </div>
          <input
            type="checkbox"
            class="h-5 w-5 accent-twitch-purple"
            :checked="feature.enabled"
            @change="handleToggle(feature.featureKey, $event)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>
