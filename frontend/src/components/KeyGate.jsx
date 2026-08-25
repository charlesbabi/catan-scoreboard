import { useState } from 'react'
import { verifyKey } from '../lib/api.js'
import { getSessionKey, setSessionKey } from '../lib/session.js'

export default function KeyGate({ children }) {
  const [key, setKey] = useState(getSessionKey)
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  if (key) return <>{children}</>

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await verifyKey(input)
      setSessionKey(input)
      setKey(input)
    } catch {
      setError('Clave incorrecta')
    }
  }

  return (
    <div class="keygate card">
      <h2>Acceso restringido</h2>
      <p>Ingresá la clave de administrador para registrar partidas.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Clave"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" class="primary">Entrar</button>
      </form>
      {error && <p class="error">{error}</p>}
    </div>
  )
}
