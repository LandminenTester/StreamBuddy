import type { useAutomessagesStore } from '@renderer/stores/automessages.store'
import type { AutomessageFormState } from './types'
import { parseMessages } from './utils'

type AutomessagesStore = ReturnType<typeof useAutomessagesStore>

export async function submitAutomessageForm(
  store: AutomessagesStore,
  form: AutomessageFormState
): Promise<void> {
  const input = {
    messages: parseMessages(form.messagesInput),
    mode: form.mode,
    intervalMinutes: form.mode === 'interval' ? form.intervalMinutes : null,
    messageCountThreshold: form.mode === 'message_count' ? form.messageCountThreshold : null,
    minChatLinesSinceLast: form.minChatLinesSinceLast,
    enabled: form.enabled
  }

  if (form.id === null) {
    await store.createAutomessage(input)
  } else {
    await store.updateAutomessage(form.id, input)
  }
}

export async function deleteAutomessageById(store: AutomessagesStore, id: number): Promise<void> {
  await store.deleteAutomessage(id)
}
