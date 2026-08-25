import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'

export const DEFAULT_ADMIN_KEY = 'catan'

export const SEED_GAMES = [
  { id: 1, date: '2026-08-01', players: [
    { name: 'Ana', points: 10 },
    { name: 'Beto', points: 7 },
    { name: 'Carla', points: 5 },
    { name: 'Diego', points: 3 },
  ] },
  { id: 2, date: '2026-08-08', players: [
    { name: 'Ana', points: 6 },
    { name: 'Beto', points: 10 },
    { name: 'Carla', points: 8 },
    { name: 'Diego', points: 4 },
  ] },
  { id: 3, date: '2026-08-15', players: [
    { name: 'Ana', points: 8 },
    { name: 'Beto', points: 4 },
    { name: 'Carla', points: 10 },
    { name: 'Diego', points: 6 },
  ] },
]

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

// ponytail: full-file sync writes; swap to atomic temp+rename if concurrent writers ever appear
export function createStore(filePath) {
  if (!existsSync(filePath)) {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify({ games: SEED_GAMES, adminKeyHash: sha256(DEFAULT_ADMIN_KEY) }, null, 2), 'utf8')
  }

  function readDoc() {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8'))
      return { games: Array.isArray(raw.games) ? raw.games : [], adminKeyHash: typeof raw.adminKeyHash === 'string' ? raw.adminKeyHash : undefined }
    } catch {
      return { games: [], adminKeyHash: undefined }
    }
  }

  function writeDoc(doc) {
    writeFileSync(filePath, JSON.stringify({ games: doc.games, adminKeyHash: doc.adminKeyHash ?? sha256(DEFAULT_ADMIN_KEY) }, null, 2), 'utf8')
  }

  return {
    path: filePath,
    getGames: () => readDoc().games,
    getAdminKeyHash: () => readDoc().adminKeyHash ?? sha256(DEFAULT_ADMIN_KEY),
    setAdminKey(key) {
      const doc = readDoc()
      doc.adminKeyHash = sha256(key)
      writeDoc(doc)
    },
    addGame({ date, players }) {
      const doc = readDoc()
      const id = doc.games.reduce((m, g) => Math.max(m, g.id), 0) + 1
      const game = { id, date, players }
      doc.games.push(game)
      writeDoc(doc)
      return game
    },
  }
}
