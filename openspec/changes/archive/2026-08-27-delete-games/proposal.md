# Proposal: delete-games

## Why

Hay partidas con información vieja/errónea que no se pueden quitar: hoy solo existe registrar, y el ranking e historial acumulan datos que el grupo ya no quiere contar.

## What Changes

- Nuevo endpoint `DELETE /api/games/:id` protegido por la clave de admin (`X-Admin-Key`): 401 si falta o es inválida, 404 si el id no corresponde a una partida, 200 en éxito.
- La capa de storage expone `deleteGame(id)` que elimina y persiste la partida.
- CORS: `Access-Control-Allow-Methods` pasa a incluir `DELETE`.
- Frontend: en el historial de la pantalla pública, cada partida muestra un botón de eliminar cuando hay clave de admin en la sesión del navegador (la misma que usa `/nueva-partida`); al borrar, refresca ranking e historial; si la API responde 401, limpia la clave de la sesión y muestra el error.
- Tests del backend (storage + API) siguiendo la convención TDD del repo.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-api`: nuevo endpoint `DELETE /api/games/:id` con autenticación de admin; el requirement de CORS incluye `DELETE` en los métodos permitidos.
- `scoreboard-storage`: la store expone eliminación de partida por id con persistencia.
- `scoreboard-frontend`: el historial permite eliminar partidas cuando hay clave de admin en sesión.

## Impact

- Backend: `src/storage.js`, `src/server.js`, nuevos tests en `test/`.
- Frontend: `src/lib/api.js` (nuevo `deleteGame`), `src/App.jsx` (botón en historial), CSS mínimo para el botón.
- Datos: sin migración; el formato del JSON no cambia.
