const KEY_STORAGE = 'catan-admin-key'

export function getSessionKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

export function setSessionKey(key) {
  try {
    sessionStorage.setItem(KEY_STORAGE, key)
  } catch {
    // sessionStorage no disponible: la clave vive solo en memoria
  }
}

export function clearSessionKey() {
  try {
    sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignore
  }
}
