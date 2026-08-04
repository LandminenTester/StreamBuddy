import { i18n, t } from '@renderer/i18n'

export function commandKeyLabel(key: string): string {
  const translationKey = `games.commandKeys.${key}`
  return i18n.global.te(translationKey) ? t(translationKey) : key
}
