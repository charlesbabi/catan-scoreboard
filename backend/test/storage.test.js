import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStore, SEED_GAMES } from '../src/storage.js'

async function tmpStore() {
  const dir = await mkdtemp(join(tmpdir(), 'scoreboard-'))
  return { dir, store: createStore(join(dir, 'scoreboard.json')), cleanup: () => rm(dir, { recursive: true, force: true }) }
}

test('seed: crea archivo con >=3 partidas, >=3 jugadores y alguno con 10 pts cuando no existe', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const games = store.getGames()
    assert.ok(games.length >= 3, `expected >=3 games, got ${games.length}`)
    const names = new Set()
    for (const g of games) for (const p of g.players) names.add(p.name)
    assert.ok(names.size >= 3, `expected >=3 players, got ${names.size}`)
    assert.ok(games.some(g => g.players.some(p => p.points === 10)), 'expected some player with 10 points')
    for (const g of games) {
      assert.ok(Number.isInteger(g.id) && g.id > 0, 'id must be positive integer')
      assert.match(g.date, /^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
      assert.ok(Array.isArray(g.players) && g.players.length >= 2, 'each game needs >=2 players')
    }
    const raw = JSON.parse(await readFile(store.path, 'utf8'))
    assert.deepEqual(raw.games, games, 'file content must match returned games')
  } finally {
    await cleanup()
  }
})

test('no re-seed: archivo existente con { "games": [] } no se reemplaza', async () => {
  const { dir, store, cleanup } = await tmpStore()
  try {
    await writeFile(store.path, JSON.stringify({ games: [] }), 'utf8')
    const games = store.getGames()
    assert.deepEqual(games, [], 'existing empty file must not be re-seeded')
  } finally {
    await cleanup()
  }
})

test('no re-seed: archivo existente con contenido propio se respeta', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const custom = { games: [{ id: 99, date: '2026-01-01', players: [{ name: 'Zoe', points: 10 }] }] }
    await writeFile(store.path, JSON.stringify(custom), 'utf8')
    assert.deepEqual(store.getGames(), custom.games)
  } finally {
    await cleanup()
  }
})

test('append: addGame agrega partida con id auto-incremental y la persiste', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const before = store.getGames().length
    const created = store.addGame({ date: '2026-08-24', players: [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 5 }] })
    assert.equal(created.id, before + 1, 'id must be max+1')
    assert.equal(created.date, '2026-08-24')
    assert.deepEqual(created.players, [{ name: 'Ana', points: 10 }, { name: 'Beto', points: 5 }])
    const raw = JSON.parse(await readFile(store.path, 'utf8'))
    assert.equal(raw.games.length, before + 1, 'game must be persisted to file')
    assert.deepEqual(raw.games[raw.games.length - 1], created)
  } finally {
    await cleanup()
  }
})

test('corrupto: archivo con JSON invalido en lectura devuelve lista vacia', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    await writeFile(store.path, '{no es json', 'utf8')
    assert.deepEqual(store.getGames(), [])
  } finally {
    await cleanup()
  }
})

test('recuperacion: escritura valida tras corrupcion deja JSON valido con la partida', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    await writeFile(store.path, '%%%corrupto', 'utf8')
    store.addGame({ date: '2026-08-24', players: [{ name: 'Ana', points: 7 }] })
    const raw = JSON.parse(await readFile(store.path, 'utf8'))
    assert.equal(raw.games.length, 1)
    assert.equal(raw.games[0].players[0].name, 'Ana')
  } finally {
    await cleanup()
  }
})

test('seed constante exportada coincide con lo escrito (sanity)', async () => {
  assert.ok(Array.isArray(SEED_GAMES) && SEED_GAMES.length >= 3)
})

test('seasons: archivo sin campo seasons se trata como lista vacia', async () => {
  const { dir, store, cleanup } = await tmpStore()
  try {
    await writeFile(store.path, JSON.stringify({ games: [] }), 'utf8')
    assert.deepEqual(store.getSeasons(), [])
  } finally {
    await cleanup()
  }
})

test('seasons: addSeason crea {id, name} con id auto-incremental y persiste junto con games y adminKeyHash', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const created = store.addSeason({ name: 'Temporada 2026-1' })
    assert.equal(created.id, 1, 'first season id must be 1')
    assert.equal(created.name, 'Temporada 2026-1')
    const second = store.addSeason({ name: 'Temporada 2026-2' })
    assert.equal(second.id, 2, 'id must be max+1')
    const raw = JSON.parse(await readFile(store.path, 'utf8'))
    assert.deepEqual(raw.seasons, [{ id: 1, name: 'Temporada 2026-1' }, { id: 2, name: 'Temporada 2026-2' }])
    assert.equal(raw.games.length, 3, 'games must be preserved')
    assert.ok(typeof raw.adminKeyHash === 'string', 'adminKeyHash must be preserved')
  } finally {
    await cleanup()
  }
})

test('addGame: persiste seasonId cuando se pasa y null cuando no', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const created = store.addGame({ date: '2026-08-24', players: [{ name: 'Ana', points: 10 }], seasonId: 1 })
    assert.equal(created.seasonId, 1)
    const created2 = store.addGame({ date: '2026-08-25', players: [{ name: 'Ana', points: 5 }] })
    assert.equal(created2.seasonId, null)
    const raw = JSON.parse(await readFile(store.path, 'utf8'))
    assert.equal(raw.games[raw.games.length - 2].seasonId, 1)
    assert.equal(raw.games[raw.games.length - 1].seasonId, null)
  } finally {
    await cleanup()
  }
})

test('archivo antiguo sin seasonId: la lectura no falla y se trata como partida sin temporada', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    await writeFile(store.path, JSON.stringify({ games: [{ id: 1, date: '2026-01-01', players: [{ name: 'Z', points: 10 }] }] }), 'utf8')
    const games = store.getGames()
    assert.equal(games.length, 1)
    assert.equal(games[0].seasonId, undefined, 'campo ausente se trata como sin temporada')
  } finally {
    await cleanup()
  }
})

test('seasons: crear temporada no afecta la lectura de partidas ni de adminKeyHash', async () => {
  const { store, cleanup } = await tmpStore()
  try {
    const gamesBefore = store.getGames()
    const hashBefore = store.getAdminKeyHash()
    store.addSeason({ name: 'Temporada 2026-1' })
    assert.deepEqual(store.getGames(), gamesBefore)
    assert.equal(store.getAdminKeyHash(), hashBefore)
  } finally {
    await cleanup()
  }
})
