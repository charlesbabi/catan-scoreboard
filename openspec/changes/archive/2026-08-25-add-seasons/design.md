# Design: add-seasons

## Context

El scoreboard de Catan ya existe con clave de admin (cambios `add-catan-scoreboard` y `add-admin-key-and-polish-scoreboard`): backend Node `http` puro sin deps, un solo JSON (`{ games: [...], adminKeyHash }`) con seed, frontend React + Vite con pantalla pública (`/`) y protegida (`/nueva-partida` detrás de `KeyGate`). No hay concepto de temporada en ninguna capa; el ranking mezcla todas las partidas históricas.

## Goals / Non-Goals

**Goals:**
- El admin (quien tiene la clave) puede crear temporadas desde la UI y desde la API.
- Las temporadas se listan vía API pública y se muestran en la pantalla protegida.
- Backward compatible: el `scoreboard.json` existente sigue funcionando sin tocar.
- TDD en toda la lógica nueva (backend `node:test`).

**Non-Goals:**
- Vincular partidas a temporadas (campo `seasonId` en `games`).
- Ranking/filtro por temporada en el scoreboard.
- Editar, renombrar o borrar temporadas.
- Fechas de inicio/fin, temporada activa, o cualquier otro atributo del `name`.

## Decisions

### 1. La temporada es `{ id, name }` y vive en el mismo JSON

El archivo pasa a `{ "games": [...], "adminKeyHash": "<hex>", "seasons": [{ "id": 1, "name": "..." }] }`.

- `name` es el único dato: no hay fechas ni estado porque nada los consume todavía; agregarlos sería YAGNI.
- `id` auto-incremental (`max(id)+1`), mismo patrón que `addGame` en `storage.js`.
- Backward compat: archivo sin `seasons` → se trata como `[]`; la siguiente escritura (`writeDoc`) persiste el campo, igual que pasó con `adminKeyHash`.
- El seed no crea temporadas: un seed con temporadas huérfanas (sin partidas) sería ruido.
- Alternativas descartadas: tabla/file aparte (un file más sin razón), atributos de fecha "por si acaso" (ningún consumer).

### 2. Endpoints: `POST /api/seasons` protegido, `GET /api/seasons` público

- `POST /api/seasons` — body `{ "name" }` + header `X-Admin-Key`, mismo patrón que `POST /api/games`: 401 sin clave (evaluada ANTES del body; 401 gana sobre 400), 400 con `name` inválido (ausente, no texto, o vacío tras trim), 201 con la temporada creada (`id` + `name` recortado).
- `GET /api/seasons` — público, en orden de creación (ascendente por `id`): es un label de referencia, y el orden cronológico es el natural para leerlo.
- Validación nueva `validateSeason` en `validate.js`, misma firma que `validateGame` (`{ error }` o `null`).
- Alternativa descartada: ruta anidada `/api/admin/seasons` — el resto de la API no anida por verbos de escritura, y `X-Admin-Key` ya marca qué es de admin.

### 3. Frontend: sección "Temporadas" dentro de `/nueva-partida`

- Nueva sección en la vista protegida (dentro de `KeyGate`, junto al form de partida y al cambio de clave): un input de nombre + botón crear, y debajo la lista de temporadas existentes (cargada con `GET /api/seasons`, refrescada tras crear).
- `lib/api.js` gana `fetchSeasons()` y `postSeason(key, name)` (mismo wrapper `request`, header `x-admin-key` como `postGame`).
- Mismas reglas que el resto de la vista: nombre vacío → error client-side sin llamar a la API; 400 → mensaje de la API; 401 → `clearSessionKey()` + re-mostrar la `KeyGate` (reusando el patrón `onKeyInvalid` de `ProtectedView`).
- La pantalla pública no cambia: las temporadas aún no filtran nada, y mostrarlas ahí no aporta nada todavía.
- Alternativa descartada: ruta nueva `/temporadas` — una sección más en la pantalla que el admin ya abre es menos UI y menos rutas.

### 4. TDD

- Backend (`node:test`, helper `withServer` existente): tests de `POST /api/seasons` (201 + persistencia, 401 sin clave / clave inválida, precedencia 401>400, 400 con `name` inválido y body no JSON), `GET /api/seasons` (orden, vacío), storage (backward compat sin `seasons`, escritura preserva partidas y `adminKeyHash`).
- Frontend: sin lógica nueva testeable (el único check client-side es "nombre no vacío", trivial); el resto se verifica en el paso de Docker, como en el cambio anterior.

## Risks / Trade-offs

- [Nombres de temporada duplicados] → Permitidos a propósito: son labels, no identidades; el `id` es la identidad. Si el grupo lo pide, un check de duplicados es una línea.
- [Temporadas huérfanas (sin partidas)] → Inevitable en este cambio: la vinculación viene después; la lista las muestra igual, sin romper nada.
- [Sin edición/eliminación, un nombre mal escrito no se corrige] → Aceptable por ahora; se re-lanza el cambio con edit/delete si pasa. Rollback simple: revertir el código y el campo `seasons` extra queda ignorado por el código viejo.
- [Full-file sync writes] → Mismo ceiling ya aceptado (`ponytail:` comment en `storage.js`); un par de temporadas no lo cambia.

## Migration Plan

1. Despliegue: `docker compose up --build` (sin cambios en compose ni en nginx).
2. El `scoreboard.json` existente funciona tal cual; `GET /api/seasons` responde `[]` y la primera escritura (crear temporada) agrega el campo `seasons`.
3. Rollback: revertir el código; el campo extra en el JSON es ignorado por el código viejo.

## Open Questions

- Ninguna bloqueante. La vinculación partida↔temporada y el ranking por temporada se definen en el próximo cambio.
