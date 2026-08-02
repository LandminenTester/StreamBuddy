import type { LoyaltyAccount } from '@shared/types/loyalty'

export { parseLoyaltyCsv } from '@shared/utils/loyaltyCsv'

export function serializeLoyaltyCsv(accounts: LoyaltyAccount[]): string {
  const lines = ['userLogin,balance']
  for (const account of accounts) {
    lines.push(`${account.userLogin},${account.balance}`)
  }
  return lines.join('\n')
}
