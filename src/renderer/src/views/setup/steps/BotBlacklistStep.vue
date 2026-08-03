<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'

const store = useLoyaltyStore()
const enabled = ref(false)
const isApplying = ref(false)

const previewBots = computed(() => store.knownBots.slice(0, 10).join(', '))

onMounted(() => {
  void store.fetchKnownBots()
})

async function applyBlacklist(value: boolean): Promise<void> {
  enabled.value = value
  if (!value) return
  isApplying.value = true
  try {
    await store.blacklistKnownBots()
  } finally {
    isApplying.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">
      {{ $t('setup.botBlacklist.title') }}
    </h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">
      {{ $t('setup.botBlacklist.description') }}
    </p>

    <div class="mt-8 max-w-xl border-t border-line py-4">
      <AppToggle
        :model-value="enabled"
        :label="$t('setup.botBlacklist.toggle')"
        :description="$t('setup.botBlacklist.toggleHint')"
        @update:model-value="applyBlacklist"
      />
      <p v-if="previewBots" class="mt-4 text-xs leading-5 text-fg-muted">
        {{ $t('setup.botBlacklist.preview', { bots: previewBots, count: store.knownBots.length }) }}
      </p>
      <AppButton
        class="mt-4"
        size="sm"
        variant="ghost"
        :loading="isApplying"
        @click="applyBlacklist(true)"
      >
        {{ $t('setup.botBlacklist.applyNow') }}
      </AppButton>
    </div>
  </div>
</template>
