<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import DataTable, { type DataTableColumn } from '@renderer/components/ui/DataTable.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import type { LoyaltyEarnRule } from '@shared/types/loyalty'
import { earnRuleLabel } from '../utils'
import { saveEarnRule } from '../functions'

const { t } = useI18n()
const store = useLoyaltyStore()

const editing = ref<LoyaltyEarnRule | null>(null)
const draft = ref<LoyaltyEarnRule | null>(null)

const columns = computed<DataTableColumn[]>(() => [
  { key: 'trigger', label: t('loyalty.earnRules.trigger') },
  { key: 'points', label: t('loyalty.earnRules.points'), align: 'right' },
  { key: 'interval', label: t('loyalty.earnRules.interval'), align: 'right' },
  { key: 'active', label: t('loyalty.earnRules.active') },
  { key: 'actions', label: '', align: 'right' }
])

function openEdit(rule: LoyaltyEarnRule): void {
  editing.value = rule
  draft.value = { ...rule }
}

async function save(): Promise<void> {
  if (!draft.value) return
  await saveEarnRule(store, draft.value)
  editing.value = null
  draft.value = null
}
</script>

<template>
  <PageSection
    :title="$t('loyalty.earnRules.title')"
    :description="$t('loyalty.earnRules.description')"
    :divided="false"
  >
    <DataTable
      :columns="columns"
      :rows="store.earnRules"
      :row-key="(rule: LoyaltyEarnRule) => rule.reason"
    >
      <template #trigger="{ row }">{{ earnRuleLabel(row.reason) }}</template>
      <template #points="{ row }">
        <span class="tabular-nums">{{ row.points }}</span>
      </template>
      <template #interval="{ row }">
        <span v-if="row.reason === 'view_time'" class="tabular-nums">{{ row.cooldownSeconds }}</span>
        <span v-else class="text-fg-subtle">—</span>
      </template>
      <template #active="{ row }">
        <AppBadge :variant="row.enabled ? 'success' : 'neutral'">
          {{ row.enabled ? $t('common.enabled') : $t('common.disabled') }}
        </AppBadge>
      </template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="ghost" @click="openEdit(row)">
          {{ $t('common.edit') }}
        </AppButton>
      </template>
    </DataTable>

    <BaseModal
      v-if="editing && draft"
      :title="$t('loyalty.earnRules.edit')"
      @close="editing = null"
    >
      <div class="space-y-5">
        <p class="text-sm font-medium text-fg">{{ earnRuleLabel(draft.reason) }}</p>
        <AppInput
          v-model="draft.points"
          type="number"
          :min="0"
          :label="$t('loyalty.earnRules.points')"
        />
        <AppInput
          v-if="draft.reason === 'view_time'"
          v-model="draft.cooldownSeconds"
          type="number"
          :min="30"
          :label="$t('loyalty.earnRules.interval')"
          :hint="$t('loyalty.earnRules.intervalHint')"
        />
        <AppToggle v-model="draft.enabled" :label="$t('loyalty.earnRules.active')" />
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="editing = null">{{ $t('common.cancel') }}</AppButton>
        <AppButton variant="primary" @click="save">{{ $t('common.save') }}</AppButton>
      </template>
    </BaseModal>
  </PageSection>
</template>
