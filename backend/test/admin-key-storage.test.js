import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStore, DEFAULT_ADMIN_KEY } from '../src/storage.js'

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

async function tmpDir() {
  return mkdtemp(join(tmpdir(), 'scoreboard-key-'))
}

test('seed crea adminKeyHash con el hash de la clave por defecto', async () => {
  const dir = await tmpDir()
  const path = join(dir, 'scoreboard.json')
  try {
    createStore(path)
    const raw = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(raw.adminKeyHash, sha256(DEFAULT_ADMIN_KEY))
    assert.ok(raw.games.length >= 3, 'seed sigue creando partidas')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('archivo existente sin adminKeyHash: getAdminKeyHash devuelve el default', async () => {
  const dir = await tmpDir()
  const path = join(dir, 'scoreboard.json')
  try {
    await writeFile(path, JSON.stringify({ games: [{ id: 1, date: '2026-01-01', players: [{ name: 'Z', points: 10 }] }] }), 'utf8')
    const store = createStore(path)
    assert.equal(store.getAdminKeyHash(), sha256(DEFAULT_ADMIN_KEY))
    assert.equal(store.getGames().length, 1, 'las partidas se leen igual')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('setAdminKey persiste el nuevo hash y preserva las partidas', async () => {
  const dir = await tmpDir()
  const path = join(dir, 'scoreboard.json')
  try {
    const store = createStore(path)
    const games = store.getGames()
    store.setAdminKey('nueva-clave-123')
    const raw = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(raw.adminKeyHash, sha256('nueva-clave-123'))
    assert.deepEqual(raw.games, games, 'partidas intactas tras cambiar clave')
    assert.equal(store.getAdminKeyHash(), sha256('nueva-clave-123'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('la siguiente escritura persiste el hash en un archivo legado', async () => {
  const dir = await tmpDir()
  const path = join(dir, 'scoreboard.json')
  try {
    await writeFile(path, JSON.stringify({ games: [] }), 'utf8')
    const store = createStore(path)
    store.addGame({ date: '2026-08-24', players: [{ name: 'A', points: 1 }] })
    const raw = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(raw.adminKeyHash, sha256(DEFAULT_ADMIN_KEY), 'hash default persistido')
    assert.equal(raw.games.length, 1)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
