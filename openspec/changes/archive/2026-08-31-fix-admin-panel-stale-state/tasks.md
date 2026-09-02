# Tasks: fix-admin-panel-stale-state

## 1. Clave de sesión leída en el momento de la petición

- [x] 1.1 `NewGameForm.jsx`: importar `getSessionKey` de `../lib/session.js` y usarla en el `postGame` de `handleSubmit`; eliminar el prop `adminKey`
- [x] 1.2 `SeasonsSection.jsx`: importar `getSessionKey` y usarla en el `postSeason` de `handleSubmit`; eliminar el prop `adminKey`
- [x] 1.3 `GamesSection.jsx`: importar `getSessionKey` y usarla en el `deleteGame` de `handleDelete`; eliminar el prop `adminKey`
- [x] 1.4 `App.jsx` (`ProtectedView`): quitar las tres props `adminKey={getSessionKey()}`

## 2. Lista de partidas compartida en ProtectedView

- [x] 2.1 `GamesSection.jsx`: eliminar el estado `games`, el `refresh` propio y el `useEffect` de mount; recibir `games` por prop (mantener `status`, `pendingGame`, `deleting` y el flujo del modal); en éxito del delete llamar a `onDeleted()`
- [x] 2.2 `App.jsx` (`ProtectedView`): pasar `games={games}` y `onDeleted={refresh}` a `GamesSection` (el `onSaved={refresh}` de `NewGameForm` queda alimentando la lista visible)

## 3. Verificación

- [x] 3.1 Frontend: `npm run lint` y `npm test` (en `frontend/`)
- [x] 3.2 Backend: `npm test` (sanity, sin cambios esperados)
- [x] 3.3 Repro end-to-end en el entorno desplegado (Chrome headless CDP): entrar al panel por la puerta de clave → registrar una partida (aparece en "Partidas" SIN recargar; el request lleva `x-admin-key` válido, no `null`) → eliminarla (desaparece SIN recargar) → limpiar la partida de prueba
