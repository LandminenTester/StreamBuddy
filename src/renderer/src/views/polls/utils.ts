import type { Poll } from '@shared/types/poll'
import { t } from '@renderer/i18n'

export function totalVotes(poll: Poll): number {
  return poll.choices.reduce((sum, choice) => sum + choice.votes, 0)
}

export function votePercentage(poll: Poll, votes: number): number {
  const total = totalVotes(poll)
  if (total === 0) return 0
  return Math.round((votes / total) * 100)
}

export function statusLabel(status: Poll['status']): string {
  return t(`polls.status.${status}`)
}
