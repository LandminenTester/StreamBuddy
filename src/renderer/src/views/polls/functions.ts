import type { usePollsStore } from '@renderer/stores/polls.store'
import type { usePollTemplatesStore } from '@renderer/stores/pollTemplates.store'
import type { PollTemplate } from '@shared/types/poll'
import type { PollFormState, PollTemplateFormState } from './types'
import { parseChoices } from './utils'

type PollsStore = ReturnType<typeof usePollsStore>
type PollTemplatesStore = ReturnType<typeof usePollTemplatesStore>

export async function submitPollForm(store: PollsStore, form: PollFormState): Promise<void> {
  await store.createPoll({
    title: form.title.trim(),
    choices: parseChoices(form.choicesInput),
    durationSeconds: form.durationSeconds,
    channelPointsVotingEnabled: form.channelPointsVotingEnabled,
    channelPointsPerVote: form.channelPointsPerVote
  })
}

export async function saveCurrentFormAsTemplate(
  templatesStore: PollTemplatesStore,
  form: PollFormState
): Promise<void> {
  await templatesStore.createTemplate({
    title: form.title.trim(),
    choices: parseChoices(form.choicesInput),
    durationSeconds: form.durationSeconds,
    channelPointsVotingEnabled: form.channelPointsVotingEnabled,
    channelPointsPerVote: form.channelPointsPerVote
  })
}

export async function submitPollTemplateForm(
  templatesStore: PollTemplatesStore,
  form: PollTemplateFormState
): Promise<void> {
  const input = {
    title: form.title.trim(),
    choices: parseChoices(form.choicesInput),
    durationSeconds: form.durationSeconds,
    channelPointsVotingEnabled: form.channelPointsVotingEnabled,
    channelPointsPerVote: form.channelPointsPerVote
  }

  if (form.id === null) {
    await templatesStore.createTemplate(input)
  } else {
    await templatesStore.updateTemplate(form.id, input)
  }
}

/** Sendet ein gespeichertes Template direkt als neue Umfrage, ohne erneutes Abtippen. */
export async function sendPollTemplate(store: PollsStore, template: PollTemplate): Promise<void> {
  await store.createPoll({
    title: template.title,
    choices: template.choices,
    durationSeconds: template.durationSeconds,
    channelPointsVotingEnabled: template.channelPointsVotingEnabled,
    channelPointsPerVote: template.channelPointsPerVote
  })
}
