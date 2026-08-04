<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppButton from '@renderer/components/ui/AppButton.vue'

const props = defineProps<{
  title: string
  description?: string
  store: {
    knownBots: string[]
    fetchKnownBots: () => Promise<void>
    blacklistKnownBots: () => Promise<void>
  }
}>()

const isApplying = ref(false)
const previewBots = computed(() => props.store.knownBots.slice(0, 10).join(', '))

onMounted(() => {
  void props.store.fetchKnownBots()
})

async function apply(): Promise<void> {
  isApplying.value = true
  try {
    await props.store.blacklistKnownBots()
  } finally {
    isApplying.value = false
  }
}
</script>

<template>
  <div class="rounded-md border border-line bg-surface-subtle p-4">
    <h3 class="text-sm font-semibold text-fg">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-xs text-fg-muted">{{ description }}</p>
    <p v-if="previewBots" class="mt-3 text-xs leading-5 text-fg-muted">
      {{
        $t('settings.knownBots.preview', {
          bots: previewBots,
          count: store.knownBots.length
        })
      }}
    </p>
    <AppButton class="mt-3" size="sm" variant="ghost" :loading="isApplying" @click="apply">
      {{ $t('settings.knownBots.apply') }}
    </AppButton>
  </div>
</template>
