# Tasks: move-deletion-to-admin-panel

## 1. Pantalla pública (solo lectura)

- [x] 1.1 `frontend/src/App.jsx`: quitar `adminKey`, `deleteError` y `handleDelete` de `PublicView`; quitar las props `adminKey`/`onDelete` de `History` y el botón de eliminar del componente; limpiar imports que queden sin uso (`deleteGame`)

## 2. Panel de administración

- [x] 2.1 Nuevo `frontend/src/components/GamesSection.jsx` (patrón de `SeasonsSection`): sección "Partidas" que lista todas las partidas (fecha + chips de jugadores) con botón "Eliminar" por partida; en éxito (200) refresca la lista; en 401 llama a `onKeyInvalid()`
- [x] 2.2 `frontend/src/App.jsx`: montar `<GamesSection adminKey={getSessionKey()} onKeyInvalid={handleKeyInvalid} />` en `ProtectedView` (tras `NewGameForm`)

## 3. Verificación

- [x] 3.1 `cd frontend && npm test && npm run lint && npm run build` — todos pasan
- [x] 3.2 Chequeo con el stack Docker: en `/` no aparece botón "Eliminar" (ni con clave en sesión); en `/nueva-partida` con clave se ve la sección "Partidas" y al eliminar se actualiza la lista; el scoreboard público queda consistente
