<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Vote } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import AppToggle from '@renderer/components/ui/AppToggle.vue'
import BaseModal from '@renderer/components/ui/BaseModal.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageHeader from '@renderer/components/ui/PageHeader.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import PollResultsBars from '@renderer/components/polls/PollResultsBars.vue'
import PollTemplateFormModal from '@renderer/components/polls/PollTemplateFormModal.vue'
import StringListInput from '@renderer/components/shared/StringListInput.vue'
import { usePollsStore } from '@renderer/stores/polls.store'
import { usePollTemplatesStore } from '@renderer/stores/pollTemplates.store'
import type { PollTemplate } from '@shared/types/poll'
import { emptyPollForm, emptyPollTemplateForm } from './types'
import type { PollTemplateFormState } from './types'
import { statusLabel } from './utils'
import {
  saveCurrentFormAsTemplate,
  sendPollTemplate,
  submitPollForm,
  submitPollTemplateForm
} from './functions'

const store = usePollsStore()
const templatesStore = usePollTemplatesStore()
const form = ref(emptyPollForm())

const isCreateModalOpen = ref(false)
const isTemplateModalOpen = ref(false)
const activeTemplateForm = ref<PollTemplateFormState>(emptyPollTemplateForm())

const endingPollId = ref<number | null>(null)
const selectedWinnerIndex = ref<number | null>(null)

onMounted(async () => {
  await store.fetchPolls()
  await templatesStore.fetchTemplates()
})

const activePoll = computed(() => store.polls.find((p) => p.status === 'active'))
const pastPolls = computed(() => store.polls.filter((p) => p.status !== 'active'))
const hasEnoughChoices = computed(
  () => form.value.choices.filter((choice) => choice.trim().length > 0).length >= 2
)

function openCreateModal(): void {
  form.value = emptyPollForm()
  store.error = null
  isCreateModalOpen.value = true
}

async function handleCreate(): Promise<void> {
  if (!hasEnoughChoices.value) return
  try {
    await submitPollForm(store, form.value)
    form.value = emptyPollForm()
    isCreateModalOpen.value = false
  } catch {
    // Store haelt die sichtbare Fehlermeldung und das Modal bleibt offen.
  }
}

async function handleSendTemplate(template: PollTemplate): Promise<void> {
  try {
    await sendPollTemplate(store, template)
  } catch {
    // Fehler wird im Template-Bereich angezeigt.
  }
}

function highestVoteIndex(choices: { votes: number }[]): number {
  let bestIndex = 0
  for (let i = 1; i < choices.length; i++) {
    if (choices[i].votes > choices[bestIndex].votes) bestIndex = i
  }
  return bestIndex
}

function startEnding(id: number): void {
  const poll = store.polls.find((p) => p.id === id)
  endingPollId.value = id
  selectedWinnerIndex.value = poll ? highestVoteIndex(poll.choices) : 0
}

function cancelEnding(): void {
  endingPollId.value = null
  selectedWinnerIndex.value = null
}

async function confirmEnding(): Promise<void> {
  if (endingPollId.value === null) return
  await store.endPoll(endingPollId.value, selectedWinnerIndex.value)
  cancelEnding()
}

async function handleReset(id: number): Promise<void> {
  await store.resetPoll(id)
  if (endingPollId.value === id) cancelEnding()
}

function openCreateTemplateModal(): void {
  activeTemplateForm.value = emptyPollTemplateForm()
  isTemplateModalOpen.value = true
}

function openEditTemplateModal(template: PollTemplate): void {
  activeTemplateForm.value = {
    id: template.id,
    title: template.title,
    choices: [...template.choices],
    durationSeconds: template.durationSeconds,
    channelPointsVotingEnabled: template.channelPointsVotingEnabled,
    channelPointsPerVote: template.channelPointsPerVote
  }
  isTemplateModalOpen.value = true
}

async function handleTemplateSubmit(templateForm: PollTemplateFormState): Promise<void> {
  await submitPollTemplateForm(templatesStore, templateForm)
  isTemplateModalOpen.value = false
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <PageHeader :title="$t('polls.title')" :description="$t('polls.description')">
      <template #actions>
        <AppButton v-if="!activePoll" variant="primary" @click="openCreateModal">
          <template #icon><Plus class="h-4 w-4" /></template>
          {{ $t('polls.create.title') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageSection :title="$t('polls.active.title')" :divided="false">
      <template v-if="activePoll" #actions>
        <AppButton size="sm" variant="danger" @click="startEnding(activePoll.id)">
          {{ $t('polls.active.end') }}
        </AppButton>
        <AppButton
          size="sm"
          variant="ghost"
          :title="$t('polls.resetHint')"
          @click="handleReset(activePoll.id)"
        >
          {{ $t('polls.active.reset') }}
        </AppButton>
      </template>

      <EmptyState v-if="!activePoll" :title="$t('polls.active.none')">
        <template #icon><Vote class="h-8 w-8" /></template>
      </EmptyState>

      <template v-else>
        <p class="text-base font-medium text-fg">{{ activePoll.title }}</p>
        <div class="mt-3">
          <PollResultsBars :poll="activePoll" />
        </div>
      </template>
    </PageSection>

    <PageSection :title="$t('polls.templates.title')">
      <template #actions>
        <AppButton size="sm" @click="openCreateTemplateModal">
          {{ $t('polls.templates.new') }}
        </AppButton>
      </template>

      <p v-if="store.error" class="mb-3 text-sm text-danger">{{ store.error }}</p>

      <EmptyState
        v-if="templatesStore.templates.length === 0"
        :title="$t('polls.templates.empty')"
      />

      <ul v-else class="divide-y divide-line border-t border-line">
        <li
          v-for="template in templatesStore.templates"
          :key="template.id"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-fg">{{ template.title }}</p>
            <p class="truncate text-xs text-fg-muted">{{ template.choices.join(' · ') }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <AppButton size="sm" variant="primary" @click="handleSendTemplate(template)">
              {{ $t('polls.templates.send') }}
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="openEditTemplateModal(template)">
              {{ $t('common.edit') }}
            </AppButton>
            <AppButton
              size="sm"
              variant="ghost"
              @click="templatesStore.deleteTemplate(template.id)"
            >
              {{ $t('common.delete') }}
            </AppButton>
          </div>
        </li>
      </ul>
    </PageSection>

    <PageSection :title="$t('polls.history.title')">
      <EmptyState v-if="pastPolls.length === 0" :title="$t('polls.history.empty')" />

      <ul v-else class="divide-y divide-line border-t border-line">
        <li v-for="poll in pastPolls" :key="poll.id" class="py-4">
          <div class="flex items-center justify-between gap-4">
            <span class="truncate text-sm font-medium text-fg">{{ poll.title }}</span>
            <AppBadge>{{ statusLabel(poll.status) }}</AppBadge>
          </div>
          <p
            v-if="poll.winnerChoiceIndex !== null && poll.choices[poll.winnerChoiceIndex]"
            class="mt-1 text-xs font-medium text-accent"
          >
            {{ $t('polls.winnerPrefix', { choice: poll.choices[poll.winnerChoiceIndex].title }) }}
          </p>
          <div class="mt-3">
            <PollResultsBars :poll="poll" />
          </div>
        </li>
      </ul>
    </PageSection>

    <BaseModal
      v-if="isCreateModalOpen"
      :title="$t('polls.create.title')"
      @close="isCreateModalOpen = false"
    >
      <div class="space-y-5">
        <AppInput v-model="form.title" :label="$t('polls.create.titleLabel')" required />

        <div>
          <p class="mb-1 text-xs font-medium text-fg-muted">{{ $t('polls.create.choices') }}</p>
          <StringListInput v-model="form.choices" />
          <p class="mt-1.5 text-xs text-fg-subtle">{{ $t('polls.choicesHint') }}</p>
        </div>

        <AppInput
          v-model="form.durationSeconds"
          type="number"
          :min="15"
          :max="1800"
          :label="$t('polls.create.duration')"
        />

        <AppToggle
          v-model="form.channelPointsVotingEnabled"
          :label="$t('polls.create.channelPoints')"
        />

        <AppInput
          v-if="form.channelPointsVotingEnabled"
          v-model="form.channelPointsPerVote"
          type="number"
          :min="1"
          :label="$t('polls.create.channelPointsCost')"
        />

        <p v-if="store.error" class="text-sm text-danger">{{ store.error }}</p>
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="saveCurrentFormAsTemplate(templatesStore, form)">
          {{ $t('polls.saveAsTemplate') }}
        </AppButton>
        <AppButton
          variant="primary"
          :loading="store.isCreating"
          :disabled="!hasEnoughChoices"
          @click="handleCreate"
        >
          {{ store.isCreating ? $t('polls.starting') : $t('polls.create.submit') }}
        </AppButton>
      </template>
    </BaseModal>

    <BaseModal
      v-if="endingPollId !== null && activePoll"
      :title="$t('polls.active.winner')"
      @close="cancelEnding"
    >
      <div class="space-y-2">
        <label
          v-for="(choice, index) in activePoll.choices"
          :key="index"
          class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface-subtle"
        >
          <input
            v-model.number="selectedWinnerIndex"
            type="radio"
            :value="index"
            class="h-4 w-4 accent-accent"
          />
          <span class="text-fg">{{ choice.title }}</span>
          <span class="ml-auto text-xs text-fg-muted">
            {{ $t('polls.votes', { count: choice.votes }) }}
          </span>
        </label>
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="cancelEnding">{{ $t('common.cancel') }}</AppButton>
        <AppButton variant="danger" @click="confirmEnding">{{ $t('polls.confirmEnd') }}</AppButton>
      </template>
    </BaseModal>

    <PollTemplateFormModal
      v-if="isTemplateModalOpen"
      :initial="activeTemplateForm"
      @close="isTemplateModalOpen = false"
      @submit="handleTemplateSubmit"
    />
  </div>
</template>
