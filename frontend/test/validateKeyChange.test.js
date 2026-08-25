import { describe, it, expect } from 'vitest'
import { validateKeyChange } from '../src/lib/validateKeyChange.js'

describe('validateKeyChange', () => {
  it('currentKey vacio -> error', () => {
    expect(validateKeyChange({ currentKey: '', newKey: 'abcd' }).error).toBeTruthy()
    expect(validateKeyChange({ currentKey: '   ', newKey: 'abcd' }).error).toBeTruthy()
  })

  it('newKey vacio o corta (<4) -> error', () => {
    expect(validateKeyChange({ currentKey: 'x', newKey: '' }).error).toBeTruthy()
    expect(validateKeyChange({ currentKey: 'x', newKey: 'abc' }).error).toBeTruthy()
    expect(validateKeyChange({ currentKey: 'x', newKey: '  abc  ' }).error).toBeTruthy()
  })

  it('newKey no texto -> error', () => {
    expect(validateKeyChange({ currentKey: 'x', newKey: 42 }).error).toBeTruthy()
    expect(validateKeyChange({ currentKey: 'x', newKey: null }).error).toBeTruthy()
  })

  it('valores validos -> null', () => {
    expect(validateKeyChange({ currentKey: 'catan', newKey: 'nueva-123' })).toBeNull()
    expect(validateKeyChange({ currentKey: 'catan', newKey: '    abcdef    ' })).toBeNull()
  })
})
