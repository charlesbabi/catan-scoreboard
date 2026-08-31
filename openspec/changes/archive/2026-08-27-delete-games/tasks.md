# Tasks: delete-games

## 1. Storage (TDD)

- [x] 1.1 Tests en rojo para `deleteGame(id)` en `backend/test/storage.test.js`: id existente devuelve la partida y reescribe el archivo (restando la partida, conservando `seasons`/`adminKeyHash`); id inexistente devuelve `null` sin modificar el archivo
- [x] 1.2 Implementar `deleteGame(id)` en `backend/src/storage.js` hasta pasar los tests

## 2. API (TDD)

- [x] 2.1 Tests en rojo para `DELETE /api/games/:id` en `backend/test/api.test.js`: 200 + partida eliminada, 401 sin clave, 401 (no 404) con clave inválida e id inexistente, 404 con clave válida e id inexistente, 404 con id no numérico, y `Access-Control-Allow-Methods` que incluye DELETE
- [x] 2.2 Implementar el endpoint en `backend/src/server.js` y agregar DELETE al CORS (`Access-Control-Allow-Methods`) hasta pasar los tests

## 3. Frontend

- [x] 3.1 `frontend/src/lib/api.js`: `deleteGame(key, id)` que llama a `DELETE /api/games/:id` con header `X-Admin-Key`
- [x] 3.2 `frontend/src/App.jsx`: `History` recibe `adminKey` y `onDelete(id)`; `PublicView` pasa la clave de sesión, el `refresh` existente y un handler 401 (`clearSessionKey` + banner de error)
- [x] 3.3 `frontend/src/index.css`: botón compacto de eliminar en las tarjetas de historial

## 4. Verificación

- [x] 4.1 `cd backend && npm test` — todos los tests pasan
- [x] 4.2 `cd frontend && npm test && npm run lint && npm run build` — todos pasan
- [x] 4.3 Chequeo manual contra el stack Docker: con clave en sesión aparece el botón y borrar actualiza ranking/historial; sin clave no aparece
