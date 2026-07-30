export type PollStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'archived'

export interface PollChoice {
  title: string
  votes: number
}

export interface Poll {
  id: number
  twitchPollId: string | null
  title: string
  choices: PollChoice[]
  status: PollStatus
  durationSeconds: number
  channelPointsVotingEnabled: boolean
  channelPointsPerVote: number
  winnerChoiceIndex: number | null
  startedAt: number | null
  endedAt: number | null
  createdAt: number
}

export interface PollCreateInput {
  title: string
  choices: string[]
  durationSeconds: number
  channelPointsVotingEnabled: boolean
  channelPointsPerVote: number
}

export interface PollTemplate {
  id: number
  title: string
  choices: string[]
  durationSeconds: number
  channelPointsVotingEnabled: boolean
  channelPointsPerVote: number
  createdAt: number
}

export type PollTemplateInput = Omit<PollTemplate, 'id' | 'createdAt'>
