export function validateGame(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'body must be a JSON object' }
  }
  const { players } = payload
  if (!Array.isArray(players) || players.length === 0) {
    return { error: 'players must be a non-empty array' }
  }
  for (let i = 0; i < players.length; i++) {
    const p = players[i]
    if (p === null || typeof p !== 'object' || Array.isArray(p)) {
      return { error: `players[${i}] must be an object` }
    }
    if (typeof p.name !== 'string' || p.name.trim() === '') {
      return { error: `players[${i}].name must be a non-empty string` }
    }
    if (typeof p.points !== 'number' || !Number.isFinite(p.points) || p.points < 0) {
      return { error: `players[${i}].points must be a finite number >= 0` }
    }
  }
  return null
}

export function validateSeason(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'body must be a JSON object' }
  }
  if (typeof payload.name !== 'string' || payload.name.trim() === '') {
    return { error: 'name must be a non-empty string' }
  }
  return null
}
