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

function seasonQuery(seasonId) {
  return seasonId == null ? '' : `?season=${seasonId}`
}

export function fetchScoreboard(seasonId) {
  return request(`/api/scoreboard${seasonQuery(seasonId)}`)
}

export function fetchGames(seasonId) {
  return request(`/api/games${seasonQuery(seasonId)}`)
}

export function fetchSeasons() {
  return request('/api/seasons')
}

export function postSeason(key, name) {
  return request('/api/seasons', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify({ name }),
  })
}

export function postGame(key, { date, players, seasonId }) {
  const body = seasonId == null ? { date, players } : { date, players, seasonId }
  return request('/api/games', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify(body),
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
