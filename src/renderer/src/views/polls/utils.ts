import type { Poll } from '@shared/types/poll'

export function totalVotes(poll: Poll): number {
  return poll.choices.reduce((sum, choice) => sum + choice.votes, 0)
}

export function votePercentage(poll: Poll, votes: number): number {
  const total = totalVotes(poll)
  if (total === 0) return 0
  return Math.round((votes / total) * 100)
}

export function parseChoices(choicesInput: string): string[] {
  return choicesInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export const STATUS_LABELS: Record<Poll['status'], string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  terminated: 'Beendet',
  archived: 'Archiviert'
}
