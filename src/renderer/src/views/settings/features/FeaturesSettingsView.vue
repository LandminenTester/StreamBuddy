<script setup lang="ts">
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { labelForFeature } from '../utils'

const authStore = useAuthStore()
</script>

<template>
  <PageSection
    :title="$t('settings.features.title')"
    :description="$t('settings.features.description')"
    :divided="false"
  >
    <div class="divide-y divide-line">
      <div v-for="feature in authStore.features" :key="feature.featureKey" class="py-4">
        <AppToggle
          :model-value="feature.enabled"
          :label="labelForFeature(feature.featureKey)?.title ?? feature.featureKey"
          :description="labelForFeature(feature.featureKey)?.description"
          @update:model-value="authStore.setFeatureEnabled(feature.featureKey, $event)"
        />
        <p v-if="feature.requiredScopes.length > 0" class="mt-2 font-mono text-xs text-fg-subtle">
          {{ $t('settings.features.requiredScopes', { scopes: feature.requiredScopes.join(', ') }) }}
        </p>
      </div>
    </div>
  </PageSection>
</template>
