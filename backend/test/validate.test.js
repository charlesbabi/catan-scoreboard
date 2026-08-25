import test from 'node:test'
import assert from 'node:assert/strict'
import { validateGame } from '../src/validate.js'

test('players ausente', () => {
  assert.ok(validateGame({}).error)
})

test('players vacia', () => {
  assert.ok(validateGame({ players: [] }).error)
})

test('players no lista', () => {
  assert.ok(validateGame({ players: 'no' }).error)
  assert.ok(validateGame({ players: {} }).error)
  assert.ok(validateGame({ players: null }).error)
})

test('name vacio o con espacios', () => {
  assert.ok(validateGame({ players: [{ name: '', points: 1 }] }).error)
  assert.ok(validateGame({ players: [{ name: '   ', points: 1 }] }).error)
})

test('name no texto', () => {
  assert.ok(validateGame({ players: [{ name: 42, points: 1 }] }).error)
  assert.ok(validateGame({ players: [{ points: 1 }] }).error)
})

test('points invalido: negativo, no numerico, ausente, NaN, Infinity', () => {
  assert.ok(validateGame({ players: [{ name: 'A', points: -3 }] }).error)
  assert.ok(validateGame({ players: [{ name: 'A', points: 'diez' }] }).error)
  assert.ok(validateGame({ players: [{ name: 'A' }] }).error)
  assert.ok(validateGame({ players: [{ name: 'A', points: NaN }] }).error)
  assert.ok(validateGame({ players: [{ name: 'A', points: Infinity }] }).error)
})

test('player no objeto', () => {
  assert.ok(validateGame({ players: ['Ana'] }).error)
  assert.ok(validateGame({ players: [null] }).error)
})

test('payload no objeto', () => {
  assert.ok(validateGame(null).error)
  assert.ok(validateGame('hola').error)
  assert.ok(validateGame([1, 2]).error)
})

test('body valido pasa', () => {
  assert.equal(
    validateGame({ date: '2026-08-24', players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 0 }] }),
    null
  )
})
