import type { UpdateStatus } from '@shared/types/appInfo'
import { t } from '@renderer/i18n'

export function updateStatusLabel(status: UpdateStatus): string {
  switch (status.state) {
    case 'checking':
      return t('update.checking')
    case 'available':
      return t('update.available', { version: status.version ?? '' })
    case 'downloading':
      return t('update.downloading', { percent: status.percent ?? 0 })
    case 'downloaded':
      return t('update.downloaded', { version: status.version ?? '' })
    case 'not-available':
      return t('update.notAvailable')
    case 'error':
      return status.message
        ? t('update.errorWithMessage', { message: status.message })
        : t('update.error')
    default:
      return t('update.idle')
  }
}
