import { useEffect, useState } from 'react'
import { fetchSeasons } from '../lib/api.js'

export function useSeasons() {
  const [seasons, setSeasons] = useState(null)
  useEffect(() => {
    fetchSeasons().then(setSeasons).catch(() => setSeasons([]))
  }, [])
  return seasons
}

export function latestSeasonId(seasons) {
  return seasons && seasons.length ? seasons.reduce((m, s) => Math.max(m, s.id), 0) : null
}

export function SeasonSelect({ seasons, value, onChange }) {
  return (
    <label class="season-picker">
      Temporada
      <select value={value} onChange={onChange}>
        {[...seasons].reverse().map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  )
}
