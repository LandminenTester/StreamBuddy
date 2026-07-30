import type { usePollsStore } from '@renderer/stores/polls.store'
import type { PollFormState } from './types'
import { parseChoices } from './utils'

type PollsStore = ReturnType<typeof usePollsStore>

export async function submitPollForm(store: PollsStore, form: PollFormState): Promise<void> {
  await store.createPoll({
    title: form.title.trim(),
    choices: parseChoices(form.choicesInput),
    durationSeconds: form.durationSeconds,
    channelPointsVotingEnabled: form.channelPointsVotingEnabled,
    channelPointsPerVote: form.channelPointsPerVote
  })
}
