import { useCallback, useEffect, useState } from 'react'
import { fetchGames, deleteGame } from '../lib/api.js'
import ConfirmModal from './ConfirmModal.jsx'

export default function GamesSection({ adminKey, onKeyInvalid }) {
  const [games, setGames] = useState(null)
  const [status, setStatus] = useState(null)
  const [pendingGame, setPendingGame] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setGames(await fetchGames())
    } catch {
      setGames([])
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteGame(adminKey, pendingGame.id)
      setPendingGame(null)
      setStatus({ type: 'ok', text: 'Partida eliminada' })
      refresh()
    } catch (err) {
      if (err.status === 401) {
        onKeyInvalid()
        return
      }
      setPendingGame(null)
      setStatus({ type: 'error', text: `No se pudo eliminar la partida: ${err.message}` })
    } finally {
      setDeleting(false)
    }
  }

  function handleCancel() {
    if (deleting) return
    setPendingGame(null)
  }

  return (
    <section>
      <h2>Partidas</h2>
      {status && <p class={status.type === 'ok' ? 'ok' : 'error'}>{status.text}</p>}
      {games === null ? (
        <p class="muted">Cargando…</p>
      ) : games.length === 0 ? (
        <p class="muted">Sin partidas.</p>
      ) : (
        <ul class="games">
          {games.map((g) => (
            <li class="card" key={g.id}>
              <span class="game-date">{g.date}</span>
              <span class="game-players">
                {g.players.map((p) => (
                  <span key={`${g.id}-${p.name}`} class="chip">
                    {p.name}: {p.points}
                  </span>
                ))}
              </span>
              <button class="game-delete" onClick={() => setPendingGame(g)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      {pendingGame && (
        <ConfirmModal
          game={pendingGame}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={handleCancel}
        />
      )}
    </section>
  )
}
