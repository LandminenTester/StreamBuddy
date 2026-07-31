export interface PollFormState {
  title: string
  choices: string[]
  durationSeconds: number
  channelPointsVotingEnabled: boolean
  channelPointsPerVote: number
}

export function emptyPollForm(): PollFormState {
  return {
    title: '',
    choices: [],
    durationSeconds: 120,
    channelPointsVotingEnabled: false,
    channelPointsPerVote: 0
  }
}

export interface PollTemplateFormState extends PollFormState {
  id: number | null
}

export function emptyPollTemplateForm(): PollTemplateFormState {
  return { id: null, ...emptyPollForm() }
}
