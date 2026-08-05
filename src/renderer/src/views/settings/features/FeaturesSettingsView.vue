<script setup lang="ts">
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import KnownBotsBlacklistCard from '@renderer/components/shared/KnownBotsBlacklistCard.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { useGreetingsStore } from '@renderer/stores/greetings.store'
import { useShoutoutStore } from '@renderer/stores/shoutout.store'
import { useI18n } from 'vue-i18n'
import { isFeatureTemporarilyUnavailable } from '@shared/temporarilyUnavailable'
import { labelForFeature } from '../utils'

const { t } = useI18n()
const authStore = useAuthStore()
const loyaltyStore = useLoyaltyStore()
const greetingsStore = useGreetingsStore()
const shoutoutStore = useShoutoutStore()

onMounted(() => {
  void shoutoutStore.fetchEnabled()
})
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
          :disabled="isFeatureTemporarilyUnavailable(feature.featureKey)"
          :label="labelForFeature(feature.featureKey)?.title ?? feature.featureKey"
          :description="labelForFeature(feature.featureKey)?.description"
          @update:model-value="authStore.setFeatureEnabled(feature.featureKey, $event)"
        />
        <p
          v-if="isFeatureTemporarilyUnavailable(feature.featureKey)"
          class="mt-2 text-xs text-warning"
        >
          {{ $t('settings.features.temporarilyUnavailable') }}
        </p>
        <p v-if="feature.requiredScopes.length > 0" class="mt-2 font-mono text-xs text-fg-subtle">
          {{ $t('settings.features.requiredScopes', { scopes: feature.requiredScopes.join(', ') }) }}
        </p>
      </div>
    </div>
  </PageSection>

  <PageSection
    :title="$t('settings.shoutout.title')"
    :description="$t('settings.shoutout.description')"
  >
    <AppToggle
      :model-value="shoutoutStore.autoShoutoutEnabled"
      :label="$t('settings.shoutout.autoLabel')"
      :description="$t('settings.shoutout.autoHint')"
      @update:model-value="shoutoutStore.setEnabled"
    />
    <p class="mt-3 text-xs leading-5 text-fg-subtle">
      {{ $t('settings.shoutout.scopeHint') }}
    </p>
  </PageSection>

  <PageSection
    :title="$t('settings.knownBots.title')"
    :description="$t('settings.knownBots.description')"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <KnownBotsBlacklistCard
        :title="t('settings.knownBots.loyaltyTitle')"
        :store="loyaltyStore"
      />
      <KnownBotsBlacklistCard
        :title="t('settings.knownBots.greetingsTitle')"
        :store="greetingsStore"
      />
    </div>
  </PageSection>
</template>
