const API_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, options)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(body?.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return body
}

export function fetchScoreboard() {
  return request('/api/scoreboard')
}

export function fetchGames() {
  return request('/api/games')
}

export function postGame(key, { date, players }) {
  return request('/api/games', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify({ date, players }),
  })
}

export function verifyKey(key) {
  return request('/api/admin/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key }),
  })
}

export function changeKey(currentKey, newKey) {
  return request('/api/admin/key', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ currentKey, newKey }),
  })
}
