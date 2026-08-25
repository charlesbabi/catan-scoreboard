function keyOf(name) {
  return String(name).trim().toLowerCase()
}

export function computeScoreboard(games) {
  const byKey = new Map()

  for (const game of games) {
    const scores = new Map()
    for (const p of game.players) {
      const key = keyOf(p.name)
      scores.set(key, (scores.get(key) ?? 0) + p.points)
    }
    let max = -1
    for (const pts of scores.values()) max = Math.max(max, pts)
    const winners = [...scores.entries()].filter(([, pts]) => pts === max).map(([key]) => key)

    for (const p of game.players) {
      const key = keyOf(p.name)
      let entry = byKey.get(key)
      if (!entry) {
        entry = { name: String(p.name).trim(), totalPoints: 0, gamesPlayed: 0, wins: 0 }
        byKey.set(key, entry)
      }
      entry.totalPoints += p.points
      entry.gamesPlayed += 1
      if (winners.length === 1 && winners[0] === key) entry.wins += 1
    }
  }

  return [...byKey.values()].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)
  )
}
