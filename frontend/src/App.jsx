import { useCallback, useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { fetchScoreboard, fetchGames } from './lib/api.js'
import { getSessionKey, clearSessionKey } from './lib/session.js'
import { SeasonSelect, useSeasons, latestSeasonId } from './components/SeasonPicker.jsx'
import KeyGate from './components/KeyGate.jsx'
import NewGameForm from './components/NewGameForm.jsx'
import SeasonsSection from './components/SeasonsSection.jsx'
import ChangeKeySection from './components/ChangeKeySection.jsx'

const PODIUM = [
  { className: 'podium-gold', label: '1º' },
  { className: 'podium-silver', label: '2º' },
  { className: 'podium-bronze', label: '3º' },
]

function Ranking({ rows }) {
  if (!rows) return <p class="muted">Cargando…</p>
  if (rows.length === 0) return <p class="muted">Aún no hay partidas registradas.</p>
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)
  return (
    <>
      <div class="podium">
        {podium.map((row, i) => (
          <div class={`card podium-card ${PODIUM[i].className}`} key={row.name}>
            <span class="podium-pos">{PODIUM[i].label}</span>
            <span class="podium-name">{row.name}</span>
            <span class="podium-points">{row.totalPoints}</span>
            <span class="podium-sub">{row.gamesPlayed} partidas · {row.wins} victorias</span>
          </div>
        ))}
      </div>
      {rest.length > 0 && (
        <table class="card">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Partidas</th>
              <th>Victorias</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((row, i) => (
              <tr key={row.name}>
                <td>
                  <span class="pos">{i + 4}º</span> {row.name}
                </td>
                <td>{row.totalPoints}</td>
                <td>{row.gamesPlayed}</td>
                <td>{row.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

function History({ games }) {
  if (!games) return <p class="muted">Cargando…</p>
  if (games.length === 0) return <p class="muted">Sin partidas.</p>
  return (
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
        </li>
      ))}
    </ul>
  )
}

// seasonId: undefined = aún no se conocen las temporadas (no fetch); null = sin temporadas (fetch global); number = ?season=<id>
function useApiData(seasonId) {
  const [scoreboard, setScoreboard] = useState(null)
  const [games, setGames] = useState(null)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (seasonId === undefined) return
    try {
      const [sb, gs] = await Promise.all([fetchScoreboard(seasonId), fetchGames(seasonId)])
      setScoreboard(sb)
      setGames(gs)
      setError(null)
    } catch (err) {
      setError(`No se pudo conectar con la API: ${err.message}`)
    }
  }, [seasonId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { scoreboard, games, error, refresh }
}

function PublicView() {
  const seasons = useSeasons()
  const [selected, setSelected] = useState(null)
  const seasonId = seasons === null ? undefined : selected ?? latestSeasonId(seasons)
  const { scoreboard, games, error } = useApiData(seasonId)
  return (
    <>
      <div class="topbar">
        <h1>Catan Scoreboard</h1>
        <Link class="link-btn primary" to="/nueva-partida">Registrar partida</Link>
      </div>
      {error && <div class="banner">{error}</div>}
      <section>
        <div class="section-head">
          <h2>Ranking</h2>
          {seasons !== null && seasons.length > 0 && (
            <SeasonSelect seasons={seasons} value={seasonId} onChange={(e) => setSelected(Number(e.target.value))} />
          )}
        </div>
        <Ranking rows={scoreboard} />
      </section>
      <section>
        <h2>Historial</h2>
        <History games={games} />
      </section>
    </>
  )
}

function ProtectedView() {
  const [gateNonce, setGateNonce] = useState(0)
  const { refresh } = useApiData(null)

  const handleKeyInvalid = () => {
    clearSessionKey()
    setGateNonce((n) => n + 1)
  }

  return (
    <div class="protected">
      <Link to="/" class="back-link">← Volver al scoreboard</Link>
      <KeyGate key={gateNonce}>
        <NewGameForm adminKey={getSessionKey()} onKeyInvalid={handleKeyInvalid} onSaved={refresh} />
        <SeasonsSection adminKey={getSessionKey()} onKeyInvalid={handleKeyInvalid} />
        <ChangeKeySection />
      </KeyGate>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicView />} />
      <Route path="/nueva-partida" element={<ProtectedView />} />
      <Route path="*" element={<PublicView />} />
    </Routes>
  )
}
