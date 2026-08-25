export function validateKeyChange({ currentKey, newKey }) {
  if (typeof currentKey !== 'string' || currentKey.trim() === '') {
    return { error: 'Ingresá la clave actual' }
  }
  if (typeof newKey !== 'string' || newKey.trim().length < 4) {
    return { error: 'La clave nueva debe tener al menos 4 caracteres' }
  }
  return null
}
