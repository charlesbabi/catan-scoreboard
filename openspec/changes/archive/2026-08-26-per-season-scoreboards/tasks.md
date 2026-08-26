# Tasks: per-season-scoreboards

TDD: los tests se escriben y corren en rojo antes de cada implementación.

## 1. Backend: filtro por temporada en los endpoints de lectura (TDD)

- [x] 1.1 Tests en rojo: con 2 temporadas (id 1 y 2) y una partida en cada una, `GET /api/scoreboard?season=1` devuelve solo el ranking de la temporada 1 y `?season=2` solo el de la 2; `GET /api/games?season=<id>` filtra igual manteniendo el orden descendente por `id`
- [x] 1.2 Tests en rojo: sin el parámetro `season` y con temporadas existentes, ambos endpoints devuelven solo la temporada más reciente; sin temporadas, devuelven todo (comportamiento actual inalterado)
- [x] 1.3 Tests en rojo: `?season=999` (id inexistente) y `?season=abc` → 404 con `{ "error" }` en ambos endpoints
- [x] 1.4 Tests en rojo: partida sin `seasonId` (datos antiguos) cuenta para la primera temporada: `?season=1` la incluye y `?season=2` no; la respuesta de `GET /api/games` normaliza `seasonId` ausente a `null`
- [x] 1.5 Implementar en `backend/src/server.js`: helper de resolución de temporada (param → id válido, default → última o todas; 404 inválido) y el filtro de partidas aplicado en las dos rutas GET; tests del grupo 1 en verde

## 2. Backend: `seasonId` en el registro de partidas (TDD)

- [x] 2.1 Tests en rojo (storage): `addGame({ date, players, seasonId })` persiste el `seasonId`; lectura de partidas antiguas sin `seasonId` no falla
- [x] 2.2 Tests en rojo: `POST /api/games` sin `seasonId` con temporadas → 201 con `seasonId` de la más reciente; sin temporadas → 201 con `seasonId: null`; con `seasonId` válida → 201 con ese id y la partida aparece en `GET /api/scoreboard?season=<ese-id>`
- [x] 2.3 Tests en rojo: `POST /api/games` con `seasonId` inexistente (999) → 400; con `seasonId` no numérica ("1") → 400; 401 de clave tiene precedencia sobre `seasonId` inválida
- [x] 2.4 Implementar: `addGame` con `seasonId` en `backend/src/storage.js` y resolución/validación de `seasonId` en la ruta `POST /api/games` de `backend/src/server.js`; todos los tests backend en verde

## 3. Frontend: selector de temporadas en la pantalla pública

- [x] 3.1 `frontend/src/lib/api.js`: `fetchScoreboard(seasonId?)` y `fetchGames(seasonId?)` con query param `season` opcional
- [x] 3.2 `PublicView` en `frontend/src/App.jsx`: cargar `GET /api/seasons` al inicio; estado `selectedSeasonId` (default: mayor `id`, `null` si no hay); `<select>` de temporadas solo si existen; al cambiar la selección, refetchea ranking e historial de esa temporada
- [x] 3.3 El historial sigue la misma temporada seleccionada que el ranking (mismo param `season`)
- [x] 3.4 CSS mínimo para el selector siguiendo el estilo de tarjetas existente

## 4. Frontend: selector de temporada en el formulario de nueva partida

- [x] 4.1 `NewGameForm` en `frontend/src/components/NewGameForm.jsx`: cargar `GET /api/seasons` al montar; `<select>` de temporada (default: la más reciente) solo si existen temporadas; `postGame` envía el `seasonId` seleccionado (u omite el campo si no hay temporadas); `frontend/src/lib/api.js`: `postGame` acepta `seasonId` opcional

## 5. Verificación final

- [x] 5.1 `npm test` en `backend/` y `frontend/`: todo verde
- [x] 5.2 `docker compose up --build`: crear 2 temporadas desde la UI; registrar una partida sin elegir temporada (debe asignarse a la más reciente) y una eligiendo la primera; en la pantalla pública se muestra la más reciente por defecto y al cambiar al selector se ven el ranking y el historial correctos de cada temporada
- [x] 5.3 Backward compat: arrancar el backend con un file de datos sin `seasons` y sin `seasonId` en partidas (DATA_FILE temporal) → comportamiento idéntico al actual; luego crear una temporada → el default pasa a esa temporada y las partidas antiguas sin etiqueta se ven en la primera
- [x] 5.4 `openspec validate per-season-scoreboards` sin errores
