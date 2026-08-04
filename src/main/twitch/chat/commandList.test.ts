import { describe, expect, it } from 'vitest'
import type { Command, PermissionLevel } from '@shared/types/command'
import { buildCommandListSections, chunkCommandSection } from './commandList'

function command(trigger: string, permissionLevel: PermissionLevel, enabled = true): Command {
  return {
    id: 1,
    trigger,
    response: '',
    aliases: [],
    permissionLevel,
    cooldownSeconds: 0,
    deliveryMode: 'public',
    enabled,
    useCount: 0,
    createdAt: 0,
    updatedAt: 0,
    trackerId: null,
    trackerAction: null,
    trackerActions: []
  }
}

describe('buildCommandListSections', () => {
  it('hides moderator commands from regular users', () => {
    const sections = buildCommandListSections({
      locale: 'de',
      userLevel: 'everyone',
      loyaltyEnabled: true,
      gameTriggers: ['!gamble'],
      customCommands: [command('!hello', 'everyone'), command('!modonly', 'moderator')]
    })

    expect(sections.map((section) => section.title)).not.toContain('Moderation')
    expect(sections.flatMap((section) => section.entries)).toContain('!hello')
    expect(sections.flatMap((section) => section.entries)).not.toContain('!modonly')
  })

  it('shows only moderator commands the current moderator may use', () => {
    const sections = buildCommandListSections({
      locale: 'en',
      userLevel: 'moderator',
      loyaltyEnabled: false,
      gameTriggers: [],
      customCommands: [command('!modonly', 'moderator'), command('!owner', 'broadcaster')]
    })
    const moderation = sections.find((section) => section.title === 'Moderation')

    expect(moderation?.entries).toContain('!modonly')
    expect(moderation?.entries).not.toContain('!owner')
    expect(sections.map((section) => section.title)).not.toContain('Games')
  })

  it('splits long sections into chat-sized messages', () => {
    const chunks = chunkCommandSection(
      'viewer',
      { title: 'Commands', entries: ['!one', '!two', '!three'] },
      30
    )
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((chunk) => chunk.length <= 30)).toBe(true)
  })
})
