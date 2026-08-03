<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import DefinitionList, { type DefinitionItem } from '@renderer/components/ui/DefinitionList.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import { useAutomessagesStore } from '@renderer/stores/automessages.store'
import { activeLocaleTag } from '@renderer/i18n'

const { t } = useI18n()
const store = useAutomessagesStore()

const isModalOpen = ref(false)
const draftEnabled = ref(false)
const draftLeadSeconds = ref(120)
const draftTexts = ref<string[]>([])

onMounted(async () => {
  await Promise.all([store.fetchAdMessageSettings(), store.fetchAdScheduleStatus()])
})

const settingsItems = computed<DefinitionItem[]>(() => [
  { key: 'enabled', label: t('automessages.ad.enabled') },
  {
    key: 'leadSeconds',
    label: t('automessages.ad.leadSeconds'),
    value: String(store.adMessageSettings.leadSeconds)
  },
  {
    key: 'texts',
    label: t('automessages.ad.texts'),
    value: t('games.texts.variants', { count: store.adMessageSettings.texts.length })
  }
])

const scheduleItems = computed<DefinitionItem[]>(() => [
  {
    key: 'nextAd',
    label: t('automessages.ad.nextAd'),
    value: formatTimestamp(store.adScheduleStatus?.nextAdAt ?? null)
  },
  {
    key: 'duration',
    label: t('automessages.ad.duration'),
    value: store.adScheduleStatus?.durationSeconds
      ? `${store.adScheduleStatus.durationSeconds}s`
      : undefined
  }
])

function formatTimestamp(iso: string | null): string | undefined {
  if (!iso) return undefined
  const timestamp = Date.parse(iso)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined
  return new Date(timestamp).toLocaleString(activeLocaleTag())
}

function openModal(): void {
  draftEnabled.value = store.adMessageSettings.enabled
  draftLeadSeconds.value = store.adMessageSettings.leadSeconds
  draftTexts.value = [...store.adMessageSettings.texts]
  isModalOpen.value = true
}

async function save(): Promise<void> {
  await store.saveAdMessageSettings({
    enabled: draftEnabled.value,
    leadSeconds: draftLeadSeconds.value,
    texts: draftTexts.value.map((line) => line.trim()).filter((line) => line.length > 0)
  })
  isModalOpen.value = false
}
</script>

<template>
  <div class="space-y-8">
    <p class="rounded-md bg-warning-bg p-4 text-sm text-warning">
      {{ $t('automessages.ad.warning') }}
    </p>

    <PageSection
      :title="$t('automessages.ad.title')"
      :description="$t('automessages.ad.description')"
      :divided="false"
    >
      <template #actions>
        <AppButton size="sm" @click="openModal">{{ $t('common.edit') }}</AppButton>
      </template>

      <DefinitionList :items="settingsItems">
        <template #enabled>
          <AppBadge :variant="store.adMessageSettings.enabled ? 'success' : 'neutral'">
            {{ store.adMessageSettings.enabled ? $t('common.enabled') : $t('common.disabled') }}
          </AppBadge>
        </template>
      </DefinitionList>
    </PageSection>

    <PageSection :title="$t('automessages.ad.schedule')">
      <p v-if="!store.adScheduleStatus" class="text-sm text-fg-muted">
        {{ $t('automessages.ad.noSchedule') }}
      </p>
      <DefinitionList v-else :items="scheduleItems" />
    </PageSection>

    <BaseModal v-if="isModalOpen" :title="$t('automessages.ad.edit')" @close="isModalOpen = false">
      <div class="space-y-5">
        <AppToggle v-model="draftEnabled" :label="$t('automessages.ad.enabled')" />
        <AppInput
          v-model="draftLeadSeconds"
          type="number"
          :min="10"
          :label="$t('automessages.ad.leadSeconds')"
        />
        <div>
          <p class="mb-2 text-xs font-medium text-fg-muted">{{ $t('automessages.ad.texts') }}</p>
          <StringListInput v-model="draftTexts" />
        </div>
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="isModalOpen = false">{{
          $t('common.cancel')
        }}</AppButton>
        <AppButton variant="primary" @click="save">{{ $t('common.save') }}</AppButton>
      </template>
    </BaseModal>
  </div>
</template>
