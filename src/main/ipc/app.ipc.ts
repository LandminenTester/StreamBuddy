import { app } from 'electron'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getAppMetadata } from '../appMetadata'
import { getChangelog } from '../changelog'
import { checkForUpdate, installUpdate } from '../updater'
import { applyTheme, getAccent, getTheme, setAccent, setTheme } from '../theme'
import { getLocale, setLocale } from '../locale'
import { completeSetup, getSetupState, resetSetup } from '../setup'
import { seedBotTextsForLocale } from '../loyalty/botTexts'

export function registerAppIpc(): void {
  handleTyped(IpcChannels.app.getVersion, () => app.getVersion())

  handleTyped(IpcChannels.app.getMetadata, () => getAppMetadata())

  handleTyped(IpcChannels.app.getChangelog, () => getChangelog())

  handleTyped(IpcChannels.app.checkForUpdate, async () => {
    await checkForUpdate()
  })

  handleTyped(IpcChannels.app.installUpdate, () => {
    installUpdate()
  })

  handleTyped(IpcChannels.app.getTheme, () => getTheme())

  handleTyped(IpcChannels.app.setTheme, ({ theme }) => {
    setTheme(theme)
    applyTheme(theme)
  })

  handleTyped(IpcChannels.app.getAccent, () => getAccent())

  handleTyped(IpcChannels.app.setAccent, ({ accent }) => {
    setAccent(accent)
  })

  handleTyped(IpcChannels.app.getLocale, () => getLocale())

  handleTyped(IpcChannels.app.setLocale, ({ locale }) => {
    setLocale(locale)
  })

  handleTyped(IpcChannels.app.getSetupState, () => getSetupState())

  handleTyped(IpcChannels.app.completeSetup, ({ locale }) => completeSetup(locale))

  handleTyped(IpcChannels.app.resetSetup, () => resetSetup())

  // Bewusst separater Kanal: ein Sprachwechsel in den Einstellungen laesst die
  // Bot-Texte in Ruhe, das Zuruecksetzen muss explizit angestossen werden.
  handleTyped(IpcChannels.app.resetBotTexts, ({ locale }) => {
    seedBotTextsForLocale(locale)
  })
}
