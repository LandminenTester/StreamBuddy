<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'

useI18n()
const store = useLoyaltyStore()

const editingName = ref(false)
const nameInput = ref('')

function startEditName(): void {
  nameInput.value = store.pointName
  editingName.value = true
}

async function saveName(): Promise<void> {
  await store.savePointName(nameInput.value)
  editingName.value = false
}

function cancelEditName(): void {
  editingName.value = false
}

async function toggleEnabled(value: boolean): Promise<void> {
  await store.setEnabled(value)
}
</script>

<template>
  <div class="space-y-8">
    <PageSection :title="$t('loyalty.settings.generalTitle')">
      <div class="space-y-6">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-fg-muted">
            {{ $t('loyalty.settings.enabledLabel') }}
          </p>
          <div class="mt-2">
            <AppToggle
              :model-value="store.isEnabled"
              :label="$t('loyalty.settings.enabledHint')"
              @update:model-value="toggleEnabled"
            />
          </div>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-fg-muted">
            {{ $t('loyalty.settings.pointNameLabel') }}
          </p>
          <div v-if="!editingName" class="mt-1 flex items-center gap-3">
            <span class="text-sm text-fg">
              {{ store.pointName || $t('loyalty.pointName') }}
            </span>
            <AppButton size="sm" variant="ghost" @click="startEditName">
              {{ $t('common.edit') }}
            </AppButton>
          </div>
          <div v-else class="mt-1 flex items-center gap-2">
            <AppInput
              v-model="nameInput"
              :placeholder="$t('loyalty.pointName')"
              class="max-w-xs"
              @keyup.enter="saveName"
              @keyup.escape="cancelEditName"
            />
            <AppButton variant="primary" size="sm" @click="saveName">
              {{ $t('common.save') }}
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="cancelEditName">
              {{ $t('common.cancel') }}
            </AppButton>
          </div>
          <p class="mt-1 text-xs text-fg-muted">
            {{ $t('loyalty.settings.pointNameHint') }}
          </p>
        </div>
      </div>
    </PageSection>
  </div>
</template>
