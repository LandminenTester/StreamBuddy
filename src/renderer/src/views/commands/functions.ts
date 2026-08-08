import type { useCommandsStore } from '@renderer/stores/commands.store'
import type { CommandFormState } from './types'
import { normalizeTrigger, parseAliases } from './utils'

type CommandsStore = ReturnType<typeof useCommandsStore>

export async function submitCommandForm(
  store: CommandsStore,
  form: CommandFormState
): Promise<void> {
  const firstAction = form.trackerActions[0] ?? null
  const input = {
    trigger: normalizeTrigger(form.trigger),
    response: form.response.trim(),
    aliases: parseAliases(form.aliasesInput),
    permissionLevel: form.permissionLevel,
    cooldownSeconds: form.cooldownSeconds,
    deliveryMode: form.deliveryMode,
    enabled: form.enabled,
    trackerId: firstAction?.trackerId ?? null,
    trackerAction: firstAction?.action ?? null,
    trackerActions: form.trackerActions,
    effectId: form.effectId
  }

  if (form.id === null) {
    await store.createCommand(input)
  } else {
    await store.updateCommand(form.id, input)
  }
}

export async function deleteCommandById(store: CommandsStore, id: number): Promise<void> {
  await store.deleteCommand(id)
}
