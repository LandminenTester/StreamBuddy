import { describe, expect, it } from 'vitest'
import { IpcChannels } from './channels'

describe('IpcChannels', () => {
  it('ist ein Objekt (Basis für spätere Channel-Registrierungen)', () => {
    expect(typeof IpcChannels).toBe('object')
  })
})
