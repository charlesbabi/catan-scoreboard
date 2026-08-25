import { useState } from 'react'
import { changeKey } from '../lib/api.js'
import { setSessionKey } from '../lib/session.js'
import { validateKeyChange } from '../lib/validateKeyChange.js'

export default function ChangeKeySection() {
  const [currentKey, setCurrentKey] = useState('')
  const [newKey, setNewKey] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const invalid = validateKeyChange({ currentKey, newKey })
    if (invalid) {
      setStatus({ type: 'error', text: invalid.error })
      return
    }
    try {
      await changeKey(currentKey.trim(), newKey.trim())
      setSessionKey(newKey.trim())
      setCurrentKey('')
      setNewKey('')
      setStatus({ type: 'ok', text: 'Clave actualizada' })
    } catch (err) {
      setStatus({ type: 'error', text: err.status === 401 ? 'Clave actual incorrecta' : err.message })
    }
  }

  return (
    <details class="card keychange">
      <summary>Cambiar clave de administrador</summary>
      <form onSubmit={handleSubmit}>
        <label>
          Clave actual
          <input type="password" value={currentKey} onChange={(e) => setCurrentKey(e.target.value)} />
        </label>
        <label>
          Clave nueva (mínimo 4 caracteres)
          <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        </label>
        <button type="submit" class="primary">Actualizar clave</button>
      </form>
      {status && <p class={status.type === 'ok' ? 'ok' : 'error'}>{status.text}</p>}
    </details>
  )
}
