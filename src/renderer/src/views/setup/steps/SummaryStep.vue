<script setup lang="ts">
import { computed } from 'vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import { useAuthStore } from '@renderer/stores/auth.store'
import { useChatStore } from '@renderer/stores/chat.store'
import { useLocaleStore } from '@renderer/stores/locale.store'
import { useThemeStore } from '@renderer/stores/theme.store'
import { ACCENTS } from '@renderer/theme/accents'
import { labelForFeature } from '@renderer/views/settings/utils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const chatStore = useChatStore()
const localeStore = useLocaleStore()
const themeStore = useThemeStore()

const enabledFeatures = computed(() =>
  authStore.features
    .filter((feature) => feature.enabled)
    .map((feature) => labelForFeature(feature.featureKey)?.title ?? feature.featureKey)
)

const items = computed<DefinitionItem[]>(() => [
  {
    key: 'language',
    label: t('setup.summary.language'),
    value: localeStore.available.find((l) => l.value === localeStore.locale)?.label
  },
  {
    key: 'appearance',
    label: t('setup.summary.appearance'),
    value: t(`settings.appearance.theme.${themeStore.theme}`)
  },
  {
    key: 'accent',
    label: t('setup.summary.accent'),
    value: t(ACCENTS[themeStore.accent].labelKey)
  },
  {
    key: 'twitch',
    label: t('setup.summary.twitch'),
    value: authStore.status.twitchLogin ?? t('setup.summary.notConnected')
  },
  {
    key: 'channel',
    label: t('setup.summary.channel'),
    value: chatStore.targetChannel ? `#${chatStore.targetChannel}` : undefined
  },
  {
    key: 'features',
    label: t('setup.summary.features'),
    value:
      enabledFeatures.value.length > 0
        ? enabledFeatures.value.join(', ')
        : t('setup.summary.noFeatures')
  }
])
</script>

<template>
  <div>
    <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ $t('setup.summary.title') }}</h1>
    <p class="mt-3 max-w-lg text-sm text-fg-muted">{{ $t('setup.summary.description') }}</p>

    <div class="mt-8 max-w-xl">
      <DefinitionList :items="items" />
    </div>
  </div>
</template>
