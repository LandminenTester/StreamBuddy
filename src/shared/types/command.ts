export type PermissionLevel = 'everyone' | 'subscriber' | 'moderator' | 'broadcaster'

export interface Command {
  id: number
  trigger: string
  response: string
  aliases: string[]
  permissionLevel: PermissionLevel
  cooldownSeconds: number
  enabled: boolean
  useCount: number
  createdAt: number
  updatedAt: number
}

export type CommandInput = Omit<Command, 'id' | 'useCount' | 'createdAt' | 'updatedAt'>
