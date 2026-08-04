import type { Command, PermissionLevel } from '@shared/types/command'

export interface CommandListSection {
  title: string
  entries: string[]
}

interface CommandListInput {
  locale: 'de' | 'en'
  userLevel: PermissionLevel
  loyaltyEnabled: boolean
  gameTriggers: string[]
  customCommands: Command[]
}

const PERMISSION_ORDER: PermissionLevel[] = ['everyone', 'subscriber', 'moderator', 'broadcaster']

export function canUseCommand(userLevel: PermissionLevel, required: PermissionLevel): boolean {
  return PERMISSION_ORDER.indexOf(userLevel) >= PERMISSION_ORDER.indexOf(required)
}

function unique(entries: string[]): string[] {
  return [...new Set(entries.filter(Boolean))]
}

export function buildCommandListSections(input: CommandListInput): CommandListSection[] {
  const de = input.locale === 'de'
  const visibleCustom = input.customCommands.filter(
    (command) => command.enabled && canUseCommand(input.userLevel, command.permissionLevel)
  )
  const publicCustom = visibleCustom
    .filter((command) => command.permissionLevel === 'everyone' || command.permissionLevel === 'subscriber')
    .map((command) => command.trigger)
  const moderatorCustom = visibleCustom
    .filter((command) => command.permissionLevel === 'moderator' || command.permissionLevel === 'broadcaster')
    .map((command) => command.trigger)

  const sections: CommandListSection[] = [
    {
      title: de ? 'Allgemein' : 'General',
      entries: de
        ? [
            '!befehle / !commands',
            '!punkte / !points [@user]',
            '!givepoints / !punktegeben @user <Punkte>',
            '!rang / !rank'
          ]
        : [
            '!commands / !befehle',
            '!points / !punkte [@user]',
            '!givepoints / !punktegeben @user <points>',
            '!rank / !rang'
          ]
    }
  ]

  if (input.loyaltyEnabled) {
    sections.push({
      title: de ? 'Spiele' : 'Games',
      entries: unique([...input.gameTriggers, de ? '!abbrechen / !cancel' : '!cancel / !abbrechen'])
    })
  }
  if (publicCustom.length > 0) {
    sections.push({ title: de ? 'Weitere Befehle' : 'More commands', entries: unique(publicCustom) })
  }
  if (canUseCommand(input.userLevel, 'moderator')) {
    sections.push({
      title: de ? 'Moderation' : 'Moderation',
      entries: unique([
        de ? '!punkteadmin @user <Betrag>' : '!pointsadmin @user <amount>',
        '!blacklist @user',
        ...moderatorCustom
      ])
    })
  }
  return sections.filter((section) => section.entries.length > 0)
}

export function chunkCommandSection(
  userLogin: string,
  section: CommandListSection,
  maxLength = 450
): string[] {
  const prefix = `@${userLogin} ${section.title}: `
  const chunks: string[] = []
  let current = prefix

  for (const entry of section.entries) {
    const addition = current === prefix ? entry : ` | ${entry}`
    if (current.length + addition.length > maxLength && current !== prefix) {
      chunks.push(current)
      current = `${prefix}${entry}`
    } else {
      current += addition
    }
  }
  if (current !== prefix) chunks.push(current)
  return chunks
}
