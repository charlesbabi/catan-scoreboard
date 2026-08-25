import http from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { computeScoreboard } from './scoreboard.js'
import { validateGame } from './validate.js'
import { sha256 } from './storage.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
      sendJson(res, 200, computeScoreboard(store.getGames()))
      return
    }

    if (req.method === 'GET' && pathname === '/api/games') {
      sendJson(res, 200, [...store.getGames()].reverse())
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
      const date = typeof payload.date === 'string' && payload.date.trim() !== '' ? payload.date.trim() : today()
      const players = payload.players.map((p) => ({ name: p.name.trim(), points: p.points }))
      sendJson(res, 201, store.addGame({ date, players }))
      return
    }

    sendJson(res, 404, { error: 'not found' })
  })
}
