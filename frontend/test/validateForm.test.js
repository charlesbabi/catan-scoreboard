import { describe, it, expect } from 'vitest'
import { validateForm } from '../src/lib/validateForm.js'

describe('validateForm', () => {
  it('lista vacia -> error', () => {
    expect(validateForm([]).error).toBeTruthy()
  })

  it('nombre vacio -> error', () => {
    expect(validateForm([{ name: '', points: '5' }]).error).toBeTruthy()
    expect(validateForm([{ name: '   ', points: '5' }]).error).toBeTruthy()
  })

  it('puntaje no numerico -> error', () => {
    expect(validateForm([{ name: 'Ana', points: 'diez' }]).error).toBeTruthy()
    expect(validateForm([{ name: 'Ana', points: '' }]).error).toBeTruthy()
  })

  it('puntaje negativo -> error', () => {
    expect(validateForm([{ name: 'Ana', points: '-3' }]).error).toBeTruthy()
  })

  it('filas validas -> null', () => {
    expect(
      validateForm([
        { name: 'Ana', points: '10' },
        { name: 'Beto', points: '0' },
      ])
    ).toBeNull()
  })

  it('puntaje con espacios y decimal se acepta', () => {
    expect(validateForm([{ name: ' Ana ', points: ' 7 ' }])).toBeNull()
    expect(validateForm([{ name: 'Ana', points: '7.5' }])).toBeNull()
  })
})
