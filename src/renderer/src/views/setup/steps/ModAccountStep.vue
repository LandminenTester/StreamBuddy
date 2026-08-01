<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { CheckCircle2, Copy, Info } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { ref } from 'vue'

const authStore = useAuthStore()
const justCopied = ref(false)

let unsubscribe: (() => void) | null = null

onMounted(async () => {
  unsubscribe = authStore.subscribeToModDeviceAuthPrompt()
  await authStore.fetchStatus()
})

onUnmounted(() => {
  unsubscribe?.()
})

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
      {{ $t('setup.modAccount.title') }}
    </h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.modAccount.description') }}</p>

    <div class="mt-6 flex items-start gap-3 rounded-md bg-surface-subtle px-4 py-3 text-sm">
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" />
      <p class="text-fg-muted">{{ $t('setup.modAccount.hint') }}</p>
    </div>

    <div v-if="authStore.status.modConnected" class="mt-8 flex items-center gap-2 text-sm">
      <CheckCircle2 class="h-5 w-5 text-success" />
      <span class="text-fg">
        {{ $t('setup.modAccount.connectedAs', { login: authStore.status.modTwitchLogin }) }}
      </span>
      <AppButton size="sm" variant="ghost" class="ml-2" @click="authStore.disconnectMod()">
        {{ $t('setup.modAccount.disconnect') }}
      </AppButton>
    </div>

    <template v-else>
      <AppButton
        variant="primary"
        class="mt-6"
        :loading="authStore.isConnectingMod"
        @click="authStore.connectMod()"
      >
        {{
          authStore.isConnectingMod
            ? $t('setup.modAccount.connecting')
            : $t('setup.modAccount.connect')
        }}
      </AppButton>

      <div v-if="authStore.modDeviceAuthPrompt" class="mt-8 max-w-md border-t border-line pt-6">
        <p class="text-sm font-medium text-fg">{{ $t('setup.connection.deviceTitle') }}</p>
        <p class="mt-2 text-sm text-fg-muted">
          {{
            $t('setup.connection.deviceStep1', {
              url: authStore.modDeviceAuthPrompt.verificationUri
            })
          }}
        </p>
        <p class="mt-4 text-sm text-fg-muted">{{ $t('setup.connection.deviceStep2') }}</p>
        <div class="mt-2 flex items-center gap-3">
          <code
            class="rounded-md bg-surface-subtle px-4 py-2 font-mono text-2xl font-semibold tracking-widest text-fg"
          >
            {{ authStore.modDeviceAuthPrompt.userCode }}
          </code>
          <AppButton size="sm" @click="copyCode(authStore.modDeviceAuthPrompt.userCode)">
            <template #icon><Copy class="h-3.5 w-3.5" /></template>
            {{ justCopied ? $t('setup.connection.copied') : $t('setup.connection.copyCode') }}
          </AppButton>
        </div>
        <p class="mt-4 text-xs text-fg-subtle">{{ $t('setup.connection.deviceWaiting') }}</p>
      </div>
    </template>
  </div>
</template>
