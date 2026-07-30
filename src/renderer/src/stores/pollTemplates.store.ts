import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PollTemplate, PollTemplateInput } from '@shared/types/poll'

export const usePollTemplatesStore = defineStore('pollTemplates', () => {
  const templates = ref<PollTemplate[]>([])

  async function fetchTemplates(): Promise<void> {
    templates.value = await window.api.invoke('pollTemplates:list', undefined)
  }

  async function createTemplate(input: PollTemplateInput): Promise<void> {
    const created = await window.api.invoke('pollTemplates:create', input)
    templates.value.unshift(created)
  }

  async function updateTemplate(id: number, input: PollTemplateInput): Promise<void> {
    const updated = await window.api.invoke('pollTemplates:update', { id, input })
    const index = templates.value.findIndex((t) => t.id === id)
    if (index !== -1) templates.value[index] = updated
  }

  async function deleteTemplate(id: number): Promise<void> {
    await window.api.invoke('pollTemplates:delete', { id })
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  return { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
})
