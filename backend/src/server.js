import http from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { computeScoreboard } from './scoreboard.js'
import { validateGame, validateSeason } from './validate.js'
import { sha256 } from './storage.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key')
}

function sendJson(res, status, body) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

// ponytail: untagged games (sin seasonId) cuentan para la primera temporada; si el grupo quiere re-etiquetado, agregar edición de partida
function seasonView(store, rawSeason) {
  const seasons = store.getSeasons()
  const firstId = seasons.length ? Math.min(...seasons.map((s) => s.id)) : null
  let id
  if (rawSeason != null) {
    id = Number(rawSeason)
    if (!Number.isInteger(id) || id < 1 || !seasons.some((s) => s.id === id)) return { invalid: true }
  } else if (seasons.length) {
    id = Math.max(...seasons.map((s) => s.id))
  }
  const games = store.getGames()
  if (id === undefined) return { games }
  return { games: games.filter((g) => g.seasonId === id || (g.seasonId == null && id === firstId)) }
}

// ponytail: timing-constant key compare, no rate limiting; add per-IP throttle if this ever leaves the LAN
function keyMatches(storedHash, key) {
  if (typeof key !== 'string') return false
  const a = Buffer.from(sha256(key))
  const b = Buffer.from(storedHash)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function createServer(store) {
  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost')

    if (req.method === 'OPTIONS') {
      cors(res)
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'GET' && pathname === '/api/scoreboard') {
      const view = seasonView(store, new URL(req.url, 'http://localhost').searchParams.get('season'))
      if (view.invalid) {
        sendJson(res, 404, { error: 'Temporada no encontrada' })
        return
      }
      sendJson(res, 200, computeScoreboard(view.games))
      return
    }

    if (req.method === 'GET' && pathname === '/api/games') {
      const view = seasonView(store, new URL(req.url, 'http://localhost').searchParams.get('season'))
      if (view.invalid) {
        sendJson(res, 404, { error: 'Temporada no encontrada' })
        return
      }
      sendJson(res, 200, view.games.map((g) => ({ ...g, seasonId: g.seasonId ?? null })).reverse())
      return
    }

    if (req.method === 'GET' && pathname === '/api/seasons') {
      sendJson(res, 200, store.getSeasons())
      return
    }

    if (req.method === 'POST' && pathname === '/api/admin/verify') {
      let payload
      try {
        payload = JSON.parse(await readBody(req))
      } catch {
        payload = null
      }
      if (payload && keyMatches(store.getAdminKeyHash(), payload.key)) {
        sendJson(res, 200, { ok: true })
      } else {
        sendJson(res, 401, { error: 'Clave inválida' })
      }
      return
    }

    if (req.method === 'POST' && pathname === '/api/admin/key') {
      let payload
      try {
        payload = JSON.parse(await readBody(req))
      } catch {
        payload = null
      }
      if (!payload || !keyMatches(store.getAdminKeyHash(), payload.currentKey)) {
        sendJson(res, 401, { error: 'Clave actual inválida' })
        return
      }
      const newKey = typeof payload.newKey === 'string' ? payload.newKey.trim() : ''
      if (newKey.length < 4) {
        sendJson(res, 400, { error: 'La nueva clave debe tener al menos 4 caracteres' })
        return
      }
      store.setAdminKey(newKey)
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && pathname === '/api/games') {
      const key = req.headers['x-admin-key']
      if (!keyMatches(store.getAdminKeyHash(), key)) {
        sendJson(res, 401, { error: 'Clave de administrador requerida' })
        return
      }
      let payload
      try {
        payload = JSON.parse(await readBody(req))
      } catch {
        sendJson(res, 400, { error: 'body must be valid JSON' })
        return
      }
      const invalid = validateGame(payload)
      if (invalid) {
        sendJson(res, 400, invalid)
        return
      }
      const seasons = store.getSeasons()
      let seasonId
      if (payload.seasonId !== undefined) {
        if (typeof payload.seasonId !== 'number' || !Number.isInteger(payload.seasonId)) {
          sendJson(res, 400, { error: 'seasonId debe ser un número' })
          return
        }
        if (!seasons.some((s) => s.id === payload.seasonId)) {
          sendJson(res, 400, { error: 'la temporada indicada no existe' })
          return
        }
        seasonId = payload.seasonId
      } else if (seasons.length) {
        seasonId = Math.max(...seasons.map((s) => s.id))
      }
      const date = typeof payload.date === 'string' && payload.date.trim() !== '' ? payload.date.trim() : today()
      const players = payload.players.map((p) => ({ name: p.name.trim(), points: p.points }))
      sendJson(res, 201, store.addGame({ date, players, seasonId: seasonId ?? null }))
      return
    }

    if (req.method === 'POST' && pathname === '/api/seasons') {
      const key = req.headers['x-admin-key']
      if (!keyMatches(store.getAdminKeyHash(), key)) {
        sendJson(res, 401, { error: 'Clave de administrador requerida' })
        return
      }
      let payload
      try {
        payload = JSON.parse(await readBody(req))
      } catch {
        sendJson(res, 400, { error: 'body must be valid JSON' })
        return
      }
      const invalid = validateSeason(payload)
      if (invalid) {
        sendJson(res, 400, invalid)
        return
      }
      sendJson(res, 201, store.addSeason({ name: payload.name.trim() }))
      return
    }

    if (req.method === 'DELETE' && /^\/api\/games\/\d+$/.test(pathname)) {
      const key = req.headers['x-admin-key']
      if (!keyMatches(store.getAdminKeyHash(), key)) {
        sendJson(res, 401, { error: 'Clave de administrador requerida' })
        return
      }
      const id = Number(pathname.split('/').pop())
      if (store.deleteGame(id) === null) {
        sendJson(res, 404, { error: 'Partida no encontrada' })
        return
      }
      sendJson(res, 200, { ok: true })
      return
    }

    sendJson(res, 404, { error: 'not found' })
  })
}
