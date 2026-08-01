<script setup lang="ts">
import { onMounted } from 'vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { labelForFeature } from '@renderer/views/settings/utils'

const authStore = useAuthStore()

onMounted(() => {
  void authStore.fetchFeatures()
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ $t('setup.features.title') }}</h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.features.description') }}</p>

    <div class="mt-8 max-w-xl divide-y divide-line">
      <!-- Chat ist die Grundlage und laesst sich nicht abwaehlen. -->
      <div class="flex items-start justify-between gap-4 py-4">
        <div class="min-w-0">
          <p class="text-sm font-medium text-fg">{{ $t('setup.features.coreChat') }}</p>
          <p class="mt-0.5 text-xs text-fg-muted">{{ $t('setup.features.coreChatDescription') }}</p>
        </div>
        <span class="shrink-0 text-xs font-medium text-success">{{ $t('common.enabled') }}</span>
      </div>

      <div v-for="feature in authStore.features" :key="feature.featureKey" class="py-4">
        <AppToggle
          :model-value="feature.enabled"
          :label="labelForFeature(feature.featureKey)?.title ?? feature.featureKey"
          :description="labelForFeature(feature.featureKey)?.description"
          @update:model-value="authStore.setFeatureEnabled(feature.featureKey, $event)"
        />
      </div>
    </div>
  </div>
</template>
