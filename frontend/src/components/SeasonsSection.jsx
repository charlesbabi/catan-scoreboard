import { useCallback, useEffect, useState } from 'react'
import { fetchSeasons, postSeason } from '../lib/api.js'
import { getSessionKey } from '../lib/session.js'

export default function SeasonsSection({ onKeyInvalid }) {
  const [seasons, setSeasons] = useState(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setSeasons(await fetchSeasons())
    } catch {
      setSeasons([])
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setStatus({ type: 'error', text: 'El nombre de la temporada es obligatorio' })
      return
    }
    try {
      await postSeason(getSessionKey(), trimmed)
      setName('')
      setStatus({ type: 'ok', text: 'Temporada creada' })
      refresh()
    } catch (err) {
      if (err.status === 401) {
        onKeyInvalid()
        return
      }
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <section class="card seasons">
      <h2>Temporadas</h2>
      <form onSubmit={handleSubmit}>
        <div class="row">
          <input
            type="text"
            placeholder="Nombre de la temporada"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" class="primary">Crear temporada</button>
        </div>
      </form>
      {status && <p class={status.type === 'ok' ? 'ok' : 'error'}>{status.text}</p>}
      {seasons === null ? (
        <p class="muted">Cargando…</p>
      ) : seasons.length === 0 ? (
        <p class="muted">Sin temporadas.</p>
      ) : (
        <ul class="seasons-list">
          {seasons.map((s) => (
            <li class="chip" key={s.id}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
