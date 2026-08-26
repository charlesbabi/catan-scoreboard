# Proposal: add-seasons

## Why

El scoreboard acumula todas las partidas en un solo ranking sin separar períodos. El grupo quiere organizar sus partidas en **temporadas** (p. ej. "Temporada 2026-1") para poder separar el ranking por período. Este cambio introduce la entidad de temporada: el admin puede crearlas; el vínculo de partidas a temporadas y el ranking por temporada vienen en un cambio posterior.

## What Changes

- Nueva entidad **temporada**: `{ id, name }`, persistida en el mismo archivo JSON del scoreboard como arreglo `seasons` (archivos existentes sin el campo siguen funcionando, se tratan como lista vacía).
- Nuevo endpoint `POST /api/seasons` protegido por la clave de admin (header `X-Admin-Key`, mismo patrón que `POST /api/games`): 401 si la clave falta o es inválida (con precedencia sobre un body inválido), 400 si `name` es inválido, 201 con la temporada creada.
- Nuevo endpoint público `GET /api/seasons` que devuelve la lista de temporadas.
- Frontend: nueva sección "Temporadas" en la pantalla protegida `/nueva-partida` (detrás de la KeyGate) con un formulario de creación (nombre) y la lista de temporadas existentes; un 401 al crear limpia la clave de sesión y re-muestra la pantalla de acceso, igual que el resto de las operaciones de admin.
- Desarrollo TDD: tests en rojo antes de cada implementación (backend `node:test`, sin cambios de dependencia).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-api`: nuevos endpoints `POST /api/seasons` (exige `X-Admin-Key`) y `GET /api/seasons` (público); validación de `name`; `POST /api/seasons` queda excluido del acceso sin autenticación.
- `scoreboard-storage`: el archivo JSON incluye el arreglo `seasons`; archivos existentes sin el campo se tratan como lista vacía y la siguiente escritura lo persiste; el seed no crea temporadas.
- `scoreboard-frontend`: la pantalla protegida `/nueva-partida` gana una sección de temporadas (crear + listar) detrás de la KeyGate, con el mismo manejo de clave invalidada que el resto de las secciones de admin.

## Impact

- Backend: `src/storage.js` (campo `seasons` + `addSeason`/`getSeasons`), `src/server.js` (2 rutas), `src/validate.js` (`validateSeason`), nuevos tests en `test/`.
- Frontend: `src/lib/api.js` (`fetchSeasons`, `postSeason`), nuevo componente de temporada en la vista protegida, ajustes mínimos de CSS. Sin nuevas dependencias.
- Docker: sin cambios.
- Backward compatible: `backend/data/scoreboard.json` existente sigue siendo válido; `GET /api/seasons` devuelve `[]` hasta que el admin cree la primera.
