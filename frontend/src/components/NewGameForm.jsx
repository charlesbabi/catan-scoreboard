import { useState } from 'react'
import { postGame } from '../lib/api.js'
import { validateForm } from '../lib/validateForm.js'

export default function NewGameForm({ adminKey, onKeyInvalid, onSaved }) {
  const [date, setDate] = useState('')
  const [rows, setRows] = useState([{ name: '', points: '' }])
  const [status, setStatus] = useState(null)

  const setRow = (i, field, value) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: value } : r)))

  async function handleSubmit(e) {
    e.preventDefault()
    const invalid = validateForm(rows)
    if (invalid) {
      setStatus({ type: 'error', text: invalid.error })
      return
    }
    try {
      await postGame(adminKey, {
        date: date.trim() || undefined,
        players: rows.map((r) => ({ name: r.name.trim(), points: Number(r.points.trim()) })),
      })
      setRows([{ name: '', points: '' }])
      setDate('')
      setStatus({ type: 'ok', text: 'Partida registrada' })
      onSaved()
    } catch (err) {
      if (err.status === 401) {
        onKeyInvalid()
        return
      }
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <form class="card" onSubmit={handleSubmit}>
      <label>
        Fecha (opcional)
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {rows.map((row, i) => (
        <div class="row" key={i}>
          <input
            type="text"
            placeholder="Jugador"
            value={row.name}
            onChange={(e) => setRow(i, 'name', e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Puntos"
            value={row.points}
            onChange={(e) => setRow(i, 'points', e.target.value)}
          />
          {rows.length > 1 && (
            <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
              ✕
            </button>
          )}
        </div>
      ))}
      <div class="actions">
        <button type="button" onClick={() => setRows((rs) => [...rs, { name: '', points: '' }])}>
          + Jugador
        </button>
        <button type="submit" class="primary">Registrar partida</button>
      </div>
      {status && <p class={status.type === 'ok' ? 'ok' : 'error'}>{status.text}</p>}
    </form>
  )
}
