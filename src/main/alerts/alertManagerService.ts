import type { AlertInstance, AlertQueueEntry, AlertQueueState } from '@shared/types/alertRule'
import { IpcChannels } from '@shared/ipc/channels'
import { broadcastAlertsClear, broadcastAlertsOverlay } from './effectsServer'
import { triggerEffect } from './effectsService'
import { getSetting, setSetting } from '../db/repositories/appSettings.repo'
import { getMainWindow } from '../window'
import { logger } from '../logger'

const MUTE_SETTING_KEY = 'alertManager.muted'
const QUEUE_LABEL_MAX_LENGTH = 40

let queue: AlertInstance[] = []
let currentInstance: AlertInstance | null = null
let currentTimeout: NodeJS.Timeout | null = null
let isPlaying = false
let muted = false

export function initAlertManagerRuntime(): void {
  muted = getSetting(MUTE_SETTING_KEY) === '1'
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  setSetting(MUTE_SETTING_KEY, value ? '1' : '0')
  if (value) stopCurrentAndClear()
}

function computeTotalDuration(instance: AlertInstance): number {
  return Math.max(
    instance.media.startMs + instance.media.durationMs,
    instance.audio.startMs + instance.audio.durationMs,
    instance.text.startMs + instance.text.durationMs
  )
}

function toQueueEntry(instance: AlertInstance): AlertQueueEntry {
  const label = instance.text.resolvedText.trim() || instance.eventType
  return {
    id: instance.id,
    eventType: instance.eventType,
    label: label.length > QUEUE_LABEL_MAX_LENGTH ? `${label.slice(0, QUEUE_LABEL_MAX_LENGTH)}…` : label
  }
}

function broadcastQueueState(): void {
  const state: AlertQueueState = {
    current: currentInstance ? toQueueEntry(currentInstance) : null,
    pending: queue.map(toQueueEntry)
  }
  getMainWindow()?.webContents.send(IpcChannels.alerts.manager.onQueueUpdate, state)
}

function playNext(): void {
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }

  const next = queue.shift()
  if (!next) {
    isPlaying = false
    currentInstance = null
    broadcastQueueState()
    return
  }

  isPlaying = true
  currentInstance = next
  broadcastAlertsOverlay(next)
  broadcastQueueState()

  if (next.linkedEffectId) {
    try {
      triggerEffect(next.linkedEffectId)
    } catch (error) {
      logger.warn(`Alert Manager: verknüpfter Effekt ${next.linkedEffectId} nicht gefunden`, error)
    }
  }

  const totalMs = computeTotalDuration(next)
  currentTimeout = setTimeout(playNext, totalMs)
}

/** Reiht einen Alert ein; startet die Wiedergabe sofort, wenn gerade nichts läuft. Bei aktiver Stummschaltung wird verworfen. */
export function enqueueAlert(instance: AlertInstance): void {
  if (muted) return
  queue.push(instance)
  broadcastQueueState()
  if (!isPlaying) playNext()
}

function stopCurrentAndClear(): void {
  queue = []
  currentInstance = null
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  isPlaying = false
  broadcastAlertsClear()
  broadcastQueueState()
}

/** Leert die Warteschlange und bricht die aktuell laufende Anzeige sofort ab (z.B. gegen Bot-Flooding). */
export function clearQueue(): void {
  stopCurrentAndClear()
}
