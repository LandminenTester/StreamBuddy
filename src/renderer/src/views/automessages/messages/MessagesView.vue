<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Repeat2 } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import AutomessageFormModal from '@renderer/components/automessages/AutomessageFormModal.vue'
import { useAutomessagesStore } from '@renderer/stores/automessages.store'
import type { Automessage } from '@shared/types/automessage'
import type { AutomessageFormState } from '../types'
import { emptyAutomessageForm } from '../types'
import { automessageToFormState, describeSchedule } from '../utils'
import { deleteAutomessageById, submitAutomessageForm } from '../functions'

const store = useAutomessagesStore()
const isModalOpen = ref(false)
const activeForm = ref<AutomessageFormState>(emptyAutomessageForm())

function openCreateModal(): void {
  activeForm.value = emptyAutomessageForm()
  isModalOpen.value = true
}

function openEditModal(automessage: Automessage): void {
  activeForm.value = automessageToFormState(automessage)
  isModalOpen.value = true
}

async function handleSubmit(form: AutomessageFormState): Promise<void> {
  await submitAutomessageForm(store, form)
  isModalOpen.value = false
}
</script>

<template>
  <PageSection :divided="false">
    <template #actions>
      <AppButton variant="primary" size="sm" @click="openCreateModal">
        <template #icon><Plus class="h-4 w-4" /></template>
        {{ $t('automessages.new') }}
      </AppButton>
    </template>

    <EmptyState
      v-if="store.automessages.length === 0"
      :title="$t('automessages.empty')"
      :description="$t('automessages.emptyHint')"
    >
      <template #icon><Repeat2 class="h-8 w-8" /></template>
      <template #action>
        <AppButton variant="primary" size="sm" @click="openCreateModal">
          {{ $t('automessages.new') }}
        </AppButton>
      </template>
    </EmptyState>

    <ul v-else class="divide-y divide-line border-t border-line">
      <li
        v-for="automessage in store.automessages"
        :key="automessage.id"
        class="flex items-start justify-between gap-6 py-4"
      >
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-fg-muted">
            {{ describeSchedule(automessage) }}
          </p>
          <ul class="mt-1.5 space-y-0.5 text-sm text-fg">
            <li v-for="(message, index) in automessage.messages" :key="index">{{ message }}</li>
          </ul>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <AppBadge :variant="automessage.enabled ? 'success' : 'neutral'">
            {{ automessage.enabled ? $t('common.enabled') : $t('common.disabled') }}
          </AppBadge>
          <AppButton size="sm" variant="ghost" @click="openEditModal(automessage)">
            {{ $t('common.edit') }}
          </AppButton>
          <AppButton
            size="sm"
            variant="ghost"
            @click="deleteAutomessageById(store, automessage.id)"
          >
            {{ $t('common.delete') }}
          </AppButton>
        </div>
      </li>
    </ul>

    <AutomessageFormModal
      v-if="isModalOpen"
      :initial="activeForm"
      @close="isModalOpen = false"
      @submit="handleSubmit"
    />
  </PageSection>
</template>
