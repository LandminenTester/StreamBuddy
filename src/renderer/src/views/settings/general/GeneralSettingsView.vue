<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import AppearancePicker from '@renderer/components/shared/AppearancePicker.vue'
import { updateStatusLabel } from '@renderer/components/shared/appUpdateStatus'
import { useAppInfoStore } from '@renderer/stores/appInfo.store'
import { useLocaleStore } from '@renderer/stores/locale.store'
import { useSetupStore } from '@renderer/stores/setup.store'
import type { AppLocale } from '@shared/types/appInfo'

const { t } = useI18n()
const router = useRouter()
const appInfoStore = useAppInfoStore()
const localeStore = useLocaleStore()
const setupStore = useSetupStore()

const botTextsReset = ref(false)

onMounted(() => {
  void appInfoStore.fetchVersion()
})

const localeOptions = computed(() =>
  localeStore.available.map((locale) => ({ value: locale.value, label: locale.label }))
)

const appItems = computed<DefinitionItem[]>(() => [
  { key: 'version', label: t('settings.general.appVersion'), value: appInfoStore.version },
  { key: 'update', label: t('settings.general.updateStatus') }
])

/**
 * Setzt die Bot-Chat-Texte bewusst auf die Standardtexte der aktuellen Sprache.
 * Ein reiner Sprachwechsel oben laesst sie unangetastet.
 */
async function resetBotTexts(): Promise<void> {
  await setupStore.resetBotTexts(localeStore.locale)
  botTextsReset.value = true
}

async function restartSetup(): Promise<void> {
  await setupStore.reset()
  await router.push({ name: 'setup' })
}
</script>

<template>
  <div class="space-y-8">
    <PageSection :divided="false">
      <div class="max-w-xs">
        <AppSelect
          :model-value="localeStore.locale"
          :options="localeOptions"
          :label="$t('settings.language.label')"
          :hint="$t('settings.language.hint')"
          @update:model-value="localeStore.setLocale($event as AppLocale)"
        />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <AppButton size="sm" @click="resetBotTexts">
          {{ $t('settings.language.resetBotTexts') }}
        </AppButton>
        <span v-if="botTextsReset" class="text-xs text-success">
          {{ $t('settings.general.botTextsReset') }}
        </span>
      </div>
    </PageSection>

    <PageSection :title="$t('settings.appearance.title')">
      <AppearancePicker />
    </PageSection>

    <PageSection :title="$t('settings.general.setup')" :description="$t('setup.restartHint')">
      <AppButton @click="restartSetup">{{ $t('setup.restart') }}</AppButton>
    </PageSection>

    <PageSection :title="$t('app.name')">
      <DefinitionList :items="appItems">
        <template #update>
          {{ updateStatusLabel(appInfoStore.updateStatus) }}
        </template>
      </DefinitionList>
      <div class="mt-4">
        <AppButton size="sm" @click="appInfoStore.checkForUpdate()">
          {{ $t('settings.general.checkForUpdate') }}
        </AppButton>
      </div>
    </PageSection>
  </div>
</template>
