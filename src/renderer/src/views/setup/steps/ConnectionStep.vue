<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CheckCircle2, Copy, ExternalLink } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import { useAuthStore } from '@renderer/stores/auth.store'

const TWITCH_CONSOLE_URL = 'https://dev.twitch.tv/console/apps/create'

const authStore = useAuthStore()
const clientIdInput = ref('')
const justCopied = ref(false)

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = authStore.subscribeToDeviceAuthPrompt()
  await Promise.all([authStore.fetchStatus(), authStore.fetchClientId()])
  clientIdInput.value = authStore.clientId
})

onUnmounted(() => {
  unsubscribe?.()
})

async function handleConnect(): Promise<void> {
  const value = clientIdInput.value.trim()
  if (!value) return
  if (value !== authStore.clientId) await authStore.saveClientId(value)
  await authStore.connect()
}

async function copyCode(code: string): Promise<void> {
  await navigator.clipboard.writeText(code)
  justCopied.value = true
  setTimeout(() => {
    justCopied.value = false
  }, 2000)
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      {{ $t('setup.connection.title') }}
    </h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.connection.description') }}</p>

    <div v-if="authStore.status.connected" class="mt-8 flex items-center gap-2 text-sm">
      <CheckCircle2 class="h-5 w-5 text-success" />
      <span class="text-fg">
        {{ $t('setup.connection.connectedAs', { login: authStore.status.twitchLogin }) }}
      </span>
    </div>

    <template v-else>
      <a
        :href="TWITCH_CONSOLE_URL"
        target="_blank"
        rel="noopener"
        class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        {{ $t('setup.connection.consoleLink') }}
        <ExternalLink class="h-3.5 w-3.5" />
      </a>

      <div class="mt-6 max-w-md">
        <AppInput
          v-model="clientIdInput"
          type="password"
          :label="$t('setup.connection.clientIdLabel')"
          :placeholder="$t('setup.connection.clientIdPlaceholder')"
          :hint="$t('setup.connection.clientIdHint')"
        />
      </div>

      <p class="mt-4 max-w-lg text-xs text-fg-subtle">
        {{ $t('setup.connection.botAccountNote') }}
      </p>

      <AppButton
        variant="primary"
        class="mt-6"
        :loading="authStore.isConnecting"
        :disabled="!clientIdInput.trim()"
        @click="handleConnect"
      >
        {{
          authStore.isConnecting
            ? $t('setup.connection.connecting')
            : $t('setup.connection.connect')
        }}
      </AppButton>

      <div v-if="authStore.deviceAuthPrompt" class="mt-8 max-w-md border-t border-line pt-6">
        <p class="text-sm font-medium text-fg">{{ $t('setup.connection.deviceTitle') }}</p>
        <p class="mt-2 text-sm text-fg-muted">
          {{
            $t('setup.connection.deviceStep1', { url: authStore.deviceAuthPrompt.verificationUri })
          }}
        </p>
        <p class="mt-4 text-sm text-fg-muted">{{ $t('setup.connection.deviceStep2') }}</p>
        <div class="mt-2 flex items-center gap-3">
          <code
            class="rounded-md bg-surface-subtle px-4 py-2 font-mono text-2xl font-semibold tracking-widest text-fg"
          >
            {{ authStore.deviceAuthPrompt.userCode }}
          </code>
          <AppButton size="sm" @click="copyCode(authStore.deviceAuthPrompt.userCode)">
            <template #icon><Copy class="h-3.5 w-3.5" /></template>
            {{ justCopied ? $t('setup.connection.copied') : $t('setup.connection.copyCode') }}
          </AppButton>
        </div>
        <p class="mt-4 text-xs text-fg-subtle">{{ $t('setup.connection.deviceWaiting') }}</p>
      </div>
    </template>
  </div>
</template>
