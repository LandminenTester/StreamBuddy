<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Download, RotateCcw, Upload } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppSelect from '@renderer/components/ui/AppSelect.vue'
import ConfirmModal from '@renderer/components/ui/ConfirmModal.vue'
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
const isResetModalOpen = ref(false)
const backupMessage = ref<string | null>(null)
const backupError = ref<string | null>(null)
const backupBusy = ref(false)

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

async function exportSettings(): Promise<void> {
  backupBusy.value = true
  backupError.value = null
  backupMessage.value = null
  try {
    const result = await window.api.invoke('app:exportSettings', undefined)
    if (result) backupMessage.value = t('settings.data.exported', { fileName: result.fileName })
  } catch (error) {
    backupError.value = String(error)
  } finally {
    backupBusy.value = false
  }
}

async function importSettings(): Promise<void> {
  backupBusy.value = true
  backupError.value = null
  backupMessage.value = null
  try {
    const result = await window.api.invoke('app:importSettings', undefined)
    if (result) backupMessage.value = t('settings.data.imported', { fileName: result.fileName })
  } catch (error) {
    backupError.value = String(error)
  } finally {
    backupBusy.value = false
  }
}

async function resetApp(): Promise<void> {
  backupBusy.value = true
  backupError.value = null
  try {
    await window.api.invoke('app:resetAll', undefined)
    isResetModalOpen.value = false
    await router.replace({ name: 'setup' })
  } catch (error) {
    backupError.value = String(error)
  } finally {
    backupBusy.value = false
  }
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

    <PageSection
      :title="$t('settings.data.title')"
      :description="$t('settings.data.description')"
    >
      <div class="flex flex-wrap gap-2">
        <AppButton size="sm" :loading="backupBusy" @click="exportSettings">
          <template #icon><Download class="h-4 w-4" /></template>
          {{ $t('settings.data.export') }}
        </AppButton>
        <AppButton size="sm" :loading="backupBusy" @click="importSettings">
          <template #icon><Upload class="h-4 w-4" /></template>
          {{ $t('settings.data.import') }}
        </AppButton>
      </div>
      <p v-if="backupMessage" class="mt-3 text-xs text-success">{{ backupMessage }}</p>
      <p v-if="backupError" class="mt-3 text-xs text-danger">{{ backupError }}</p>

      <div class="mt-6 border-t border-line pt-5">
        <p class="text-sm font-medium text-fg">{{ $t('settings.data.resetTitle') }}</p>
        <p class="mt-1 max-w-xl text-xs leading-5 text-fg-muted">
          {{ $t('settings.data.resetDescription') }}
        </p>
        <AppButton
          class="mt-3"
          size="sm"
          variant="danger"
          :loading="backupBusy"
          @click="isResetModalOpen = true"
        >
          <template #icon><RotateCcw class="h-4 w-4" /></template>
          {{ $t('settings.data.resetButton') }}
        </AppButton>
      </div>
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

  <ConfirmModal
    v-if="isResetModalOpen"
    :title="$t('settings.data.resetConfirmTitle')"
    :message="$t('settings.data.resetConfirmMessage')"
    :confirm-label="$t('settings.data.resetConfirm')"
    variant="danger"
    @close="isResetModalOpen = false"
    @confirm="resetApp"
  />
</template>
