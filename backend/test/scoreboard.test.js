import test from 'node:test'
import assert from 'node:assert/strict'
import { computeScoreboard } from '../src/scoreboard.js'

test('agrega totalPoints, gamesPlayed y wins; orden por totalPoints desc', () => {
  const games = [
    { id: 1, date: '2026-08-01', players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 7 }] },
    { id: 2, date: '2026-08-02', players: [{ name: 'Ana', points: 8 }, { name: 'Beto', points: 12 }] },
  ]
  assert.deepEqual(computeScoreboard(games), [
    { name: 'Beto', totalPoints: 19, gamesPlayed: 2, wins: 1 },
    { name: 'Ana', totalPoints: 18, gamesPlayed: 2, wins: 1 },
  ])
})

test('sin partidas devuelve lista vacia', () => {
  assert.deepEqual(computeScoreboard([]), [])
})

test('empate de maximo: ninguna entrada cuenta victoria', () => {
  const games = [
    { id: 1, date: '2026-08-01', players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 10 }, { name: 'Carla', points: 4 }] },
  ]
  assert.deepEqual(computeScoreboard(games), [
    { name: 'Ana', totalPoints: 10, gamesPlayed: 1, wins: 0 },
    { name: 'Beto', totalPoints: 10, gamesPlayed: 1, wins: 0 },
    { name: 'Carla', totalPoints: 4, gamesPlayed: 1, wins: 0 },
  ])
})

test('agrupa por nombre con lowercase+trim y primera capitalizacion vista', () => {
  const games = [
    { id: 1, date: '2026-08-01', players: [{ name: '  Ana ', points: 5 }, { name: 'Beto', points: 1 }] },
    { id: 2, date: '2026-08-02', players: [{ name: 'ana', points: 3 }, { name: 'BETO', points: 2 }] },
  ]
  assert.deepEqual(computeScoreboard(games), [
    { name: 'Ana', totalPoints: 8, gamesPlayed: 2, wins: 2 },
    { name: 'Beto', totalPoints: 3, gamesPlayed: 2, wins: 0 },
  ])
})

test('ordenes de empates de totalPoints estables (por nombre)', () => {
  const games = [
    { id: 1, date: '2026-08-01', players: [{ name: 'Beto', points: 5 }, { name: 'Ana', points: 5 }] },
  ]
  assert.deepEqual(computeScoreboard(games), [
    { name: 'Ana', totalPoints: 5, gamesPlayed: 1, wins: 0 },
    { name: 'Beto', totalPoints: 5, gamesPlayed: 1, wins: 0 },
  ])
})
