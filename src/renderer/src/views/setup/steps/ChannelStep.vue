<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import { useChatStore } from '@renderer/stores/chat.store'

const chatStore = useChatStore()
const channelInput = ref('')

onMounted(async () => {
  await Promise.all([chatStore.fetchTargetChannel(), chatStore.fetchAutoConnect()])
  channelInput.value = chatStore.targetChannel
})

/**
 * Der Kanal wird direkt beim Tippen uebernommen, damit der Weiter-Button des
 * Wizards nicht von einem separaten Speichern-Klick abhaengt.
 */
watch(channelInput, (value) => {
  const trimmed = value.trim()
  if (trimmed && trimmed !== chatStore.targetChannel) {
    void chatStore.saveTargetChannel(trimmed)
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ $t('setup.channel.title') }}</h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.channel.description') }}</p>

    <div class="mt-8 max-w-md space-y-6">
      <AppInput
        v-model="channelInput"
        :label="$t('setup.channel.label')"
        :placeholder="$t('setup.channel.placeholder')"
      />

      <AppToggle
        :model-value="chatStore.autoConnect"
        :label="$t('setup.channel.autoConnect')"
        :description="$t('setup.channel.autoConnectHint')"
        @update:model-value="chatStore.setAutoConnect($event)"
      />
    </div>
  </div>
</template>
