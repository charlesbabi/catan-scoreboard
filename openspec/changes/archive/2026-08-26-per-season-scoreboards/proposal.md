# Proposal: per-season-scoreboards

## Why

Hoy la entidad de temporada existe (se pueden crear y listar), pero las partidas no están vinculadas a ninguna temporada y solo hay un ranking global: todas las partidas de la historia se acumulan en un solo scoreboard. El grupo quiere que **cada temporada tenga sus propias partidas y su propio scoreboard**, mostrando por defecto la temporada más reciente y permitiendo elegir cualquier temporada anterior.

## What Changes

- Cada partida pasa a pertenecer a una temporada: nuevo campo `seasonId` (number o `null`) en el juego persistido. `POST /api/games` acepta `seasonId` opcional; si se omite se asigna a la temporada más reciente (o `null` si no hay temporadas), y si se envía un id inexistente responde 400.
- `GET /api/scoreboard` y `GET /api/games` aceptan el query param opcional `season=<id>`: devuelven el ranking / las partidas **solo de esa temporada**. Sin el parámetro, si existen temporadas se usa la más reciente; si no hay temporadas se conserva el comportamiento actual (todas las partidas).
- Regla de migración: las partidas sin `seasonId` (creadas antes de que existieran temporadas) cuentan para la **primera** (más antigua) temporada; si no hay temporadas, se muestran en la vista global como hoy.
- Frontend: la pantalla pública (`/`) muestra un selector de temporadas con la más reciente seleccionada por defecto; al cambiar de temporada se recargan el ranking y el historial de esa temporada. Si no hay temporadas, no muestra selector y conserva el comportamiento actual.
- Frontend: el formulario de nueva partida (`/nueva-partida`) incluye un selector de temporada (por defecto la más reciente) que envía `seasonId` en `POST /api/games`; si no hay temporadas, no muestra el selector.
- Desarrollo TDD: tests en rojo antes de cada implementación (backend `node:test`, frontend `vitest`), sin cambios de dependencia.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-api`: `GET /api/scoreboard` y `GET /api/games` aceptan el filtro opcional `?season=<id>` y por defecto devuelven la temporada más reciente cuando existen temporadas; `POST /api/games` acepta `seasonId` opcional con validación (id existente, 400 si no).
- `scoreboard-storage`: la estructura del juego incluye `seasonId` (number o `null`); los archivos existentes sin el campo siguen siendo válidos y se tratan como partidas sin temporada; `addGame` persiste el `seasonId`.
- `scoreboard-frontend`: la pantalla pública gana un selector de temporadas (por defecto la más reciente) que recarga ranking e historial al cambiar; el formulario de nueva partida gana un selector de temporada que envía `seasonId`.

## Impact

- Backend: `src/storage.js` (`addGame` con `seasonId`), `src/server.js` (query param `season` en `GET /api/scoreboard` y `GET /api/games`, resolución de temporada por defecto, validación de `seasonId` en `POST /api/games`), nuevos tests en `test/`.
- Frontend: `src/lib/api.js` (params opcionales), `src/App.jsx` (selector de temporada en la vista pública), `src/components/NewGameForm.jsx` (selector de temporada), ajustes mínimos de CSS. Sin nuevas dependencias.
- Docker: sin cambios.
- Backward compatible: `backend/data/scoreboard.json` existente sigue siendo válido; sin temporadas creadas, todos los endpoints se comportan exactamente como hoy.
