<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import type { FeatureKey } from '@shared/types/auth'
import { initSettings, onToggleFeature } from './functions'
import { labelForFeature, updateStatusLabel } from './utils'

const authStore = useAuthStore()
const chatStore = useChatStore()
const appInfoStore = useAppInfoStore()
const channelInput = ref('')
const clientIdInput = ref('')
const isClientIdVisible = ref(false)
const isChangelogOpen = ref(false)

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = await initSettings(authStore, chatStore, appInfoStore)
  channelInput.value = chatStore.targetChannel
  clientIdInput.value = authStore.clientId
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

function handleSaveClientId(): void {
  if (!clientIdInput.value.trim()) return
  void authStore.saveClientId(clientIdInput.value.trim())
}

function handleToggleAutoConnect(event: Event): void {
  const enabled = (event.target as HTMLInputElement).checked
  void chatStore.setAutoConnect(enabled)
}

function handleConnectNow(): void {
  void chatStore.connectNow()
}

function handleCheckForUpdate(): void {
  void appInfoStore.checkForUpdate()
}

function handleInstallUpdate(): void {
  void appInfoStore.installUpdate()
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

      <div v-if="!authStore.status.connected" class="mt-3">
        <label class="block text-xs font-medium text-slate-500">
          Twitch-Client-ID (aus deiner Twitch-Developer-App)
        </label>
        <div class="mt-1 flex items-center gap-2">
          <div class="relative flex-1">
            <input
              v-model="clientIdInput"
              :type="isClientIdVisible ? 'text' : 'password'"
              placeholder="Client-ID eintragen"
              class="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              :aria-label="isClientIdVisible ? 'Client-ID verbergen' : 'Client-ID anzeigen'"
              @click="isClientIdVisible = !isClientIdVisible"
            >
              <svg
                v-if="isClientIdVisible"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-4 w-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-4 w-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <button
            class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            :disabled="authStore.isSavingClientId || !clientIdInput.trim()"
            @click="handleSaveClientId"
          >
            Speichern
          </button>
        </div>
      </div>

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
          :disabled="authStore.isConnecting || !authStore.clientId"
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
        v-if="authStore.isConnecting && authStore.deviceAuthPrompt"
        class="mt-4 rounded-md bg-twitch-purple/10 p-4 text-sm"
      >
        <p class="font-medium">Autorisierung auf Twitch abschließen:</p>
        <p class="mt-2">
          1. Öffne
          <a
            :href="authStore.deviceAuthPrompt.verificationUri"
            target="_blank"
            rel="noopener"
            class="text-twitch-purple underline"
          >
            {{ authStore.deviceAuthPrompt.verificationUri }}
          </a>
          (öffnet sich automatisch im Browser)
        </p>
        <p class="mt-1">
          2. Gib diesen Code ein:
          <code
            class="ml-1 rounded bg-white px-2 py-1 font-mono text-base font-semibold dark:bg-slate-800"
          >
            {{ authStore.deviceAuthPrompt.userCode }}
          </code>
        </p>
        <p class="mt-2 text-xs text-slate-500">Wartet auf Bestätigung…</p>
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

      <div class="mt-3 flex items-center justify-between gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="h-4 w-4 shrink-0 accent-twitch-purple"
            :checked="chatStore.autoConnect"
            @change="handleToggleAutoConnect"
          />
          Automatisch verbinden (beim App-Start)
        </label>
        <button
          v-if="!chatStore.autoConnect"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          :disabled="chatStore.isConnecting"
          @click="handleConnectNow"
        >
          {{ chatStore.isConnecting ? 'Verbinde…' : 'Jetzt verbinden' }}
        </button>
      </div>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Features</h2>

      <ul class="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        <li
          v-for="feature in authStore.features"
          :key="feature.featureKey"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ labelForFeature(feature.featureKey)?.title ?? feature.featureKey }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ labelForFeature(feature.featureKey)?.description }}
            </p>
          </div>
          <input
            type="checkbox"
            class="h-5 w-5 shrink-0 accent-twitch-purple"
            :checked="feature.enabled"
            @change="handleToggle(feature.featureKey, $event)"
          />
        </li>
      </ul>
    </section>

    <section class="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">App & Updates</h2>

      <div class="mt-3 flex items-center justify-between gap-4">
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
            Jetzt installieren & neu starten
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
        class="mt-2 text-xs text-amber-600 dark:text-amber-400"
      >
        Die App wird beim Installieren beendet und neu gestartet -- nicht während eines laufenden
        Streams ausführen.
      </p>

      <dl
        v-if="appInfoStore.metadata"
        class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800"
      >
        <dt class="text-slate-500 dark:text-slate-400">Ersteller</dt>
        <dd>{{ appInfoStore.metadata.author }}</dd>
        <dt class="text-slate-500 dark:text-slate-400">Lizenz</dt>
        <dd>{{ appInfoStore.metadata.license }}</dd>
        <template v-if="appInfoStore.metadata.repositoryUrl">
          <dt class="text-slate-500 dark:text-slate-400">Repository</dt>
          <dd>
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

      <button
        type="button"
        class="mt-4 flex w-full items-center justify-between text-left"
        @click="isChangelogOpen = !isChangelogOpen"
      >
        <span class="text-sm font-medium">Changelog anzeigen</span>
        <span class="text-xs text-slate-400">{{ isChangelogOpen ? '▲' : '▼' }}</span>
      </button>
      <div v-if="isChangelogOpen" class="mt-3 max-h-96 space-y-4 overflow-y-auto text-sm">
        <p v-if="appInfoStore.changelog.length === 0" class="py-2 text-center text-slate-500">
          Kein Changelog verfügbar.
        </p>
        <div v-for="entry in appInfoStore.changelog" :key="entry.version">
          <p class="font-medium">
            v{{ entry.version }}
            <span v-if="entry.date" class="font-normal text-slate-500">({{ entry.date }})</span>
          </p>
          <div v-for="section in entry.sections" :key="section.title" class="mt-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ section.title }}
            </p>
            <ul class="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600 dark:text-slate-300">
              <li v-for="(item, index) in section.items" :key="index">
                <strong v-if="item.scope">{{ item.scope }}:</strong> {{ item.text }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
