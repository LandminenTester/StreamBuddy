import { describe, expect, it } from 'vitest'
import { parseLoyaltyCsv, previewLoyaltyCsv } from './loyaltyCsv'

describe('loyaltyCsv', () => {
  it('parses semicolon csv with inferred German headers', () => {
    const result = parseLoyaltyCsv('Name;Punkte\nAlice;120\nBob;80', ';')

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      { userLogin: 'alice', balance: 120 },
      { userLogin: 'bob', balance: 80 }
    ])
  })

  it('maps arbitrary columns for preview and import parsing', () => {
    const content = 'points,ignored,login\n42,x,ViewerOne\n17,y,ViewerTwo'
    const mapping = { userLoginColumn: 2, balanceColumn: 0 }

    expect(previewLoyaltyCsv(content, ',', mapping).parsedRows).toEqual([
      { userLogin: 'viewerone', balance: 42 },
      { userLogin: 'viewertwo', balance: 17 }
    ])
  })
})
