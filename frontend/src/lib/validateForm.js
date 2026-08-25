export function validateForm(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'Agrega al menos un jugador' }
  }
  for (let i = 0; i < rows.length; i++) {
    const { name, points } = rows[i]
    if (typeof name !== 'string' || name.trim() === '') {
      return { error: `Fila ${i + 1}: el nombre es requerido` }
    }
    const trimmed = String(points ?? '').trim()
    const value = Number(trimmed)
    if (trimmed === '' || !Number.isFinite(value) || value < 0) {
      return { error: `Fila ${i + 1}: el puntaje debe ser un número ≥ 0` }
    }
  }
  return null
}
