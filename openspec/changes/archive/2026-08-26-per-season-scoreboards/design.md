# Design: per-season-scoreboards

## Context

El cambio `add-seasons` ya introdujo la entidad de temporada (`{ id, name }` en el mismo JSON, `POST/GET /api/seasons`, sección de creación en `/nueva-partida`). Pero las partidas no están vinculadas a temporadas y el ranking es global e histórico: todo se mezcla en un solo scoreboard. El grupo quiere que cada temporada tenga sus propias partidas y su propio ranking, mostrando por defecto la más reciente y pudiendo elegir las anteriores. Backend: Node `http` puro sin deps, un solo JSON con seed. Frontend: React + Vite, pantalla pública (`/`) y protegida (`/nueva-partida`).

## Goals / Non-Goals

**Goals:**
- Cada partida pertenece a una temporada (`seasonId`, opcional para datos antiguos).
- `GET /api/scoreboard` y `GET /api/games` filtran por temporada; por defecto devuelven la temporada más reciente (o todo, si no hay temporadas).
- `POST /api/games` asigna la partida a la temporada más reciente por defecto, o a la indicada con `seasonId`.
- La UI pública muestra un selector de temporadas (default: la más reciente) que recarga ranking e historial; el formulario de nueva partida incluye un selector de temporada.
- Backward compatible: el `scoreboard.json` existente (sin `seasonId` en partidas, sin `seasons`) sigue funcionando sin migración.
- TDD en toda la lógica nueva.

**Non-Goals:**
- Editar, renombrar o borrar temporadas (ya excluido en `add-seasons`).
- Vista "global" combinando todas las temporadas en la UI.
- Temporada "activa" explícita distinta de la más reciente; fechas de inicio/fin.
- Migración/re-etiquetado manual de partidas entre temporadas.

## Decisions

### 1. `seasonId` en la partida + query param `?season=<id>`, sin rutas nuevas

La estructura de juego pasa a `{ id, date, players, seasonId }` con `seasonId: number | null`. Los endpoints existentes aceptan un query param opcional en lugar de rutas anidadas (`/api/seasons/:id/scoreboard`).

- Razón: reutiliza las 2 rutas actuales; el comportamiento sin parámetro sigue siendo un solo endpoint para clientes viejos (curl, etc.); el frontend solo agrega un param.
- Alternativa descartada: rutas anidadas por temporada — más superficie de API para lo mismo, y el "default = última" no tendría endpoint natural.

### 2. Resolución de temporada (server-side)

Regla única usada por `GET /api/scoreboard` y `GET /api/games`:

1. Con `season=<id>` válido: solo partidas de esa temporada. Con `season` inválido (no entero positivo o id inexistente): **404** `{ "error" }`.
2. Sin parámetro: si existen temporadas → la más reciente (mayor `id`); si no → todas las partidas (comportamiento actual).

Partidas que matchean la temporada resuelta `S`: `game.seasonId === S`, o `game.seasonId` ausente/`null` cuando `S` es la **primera** temporada (menor `id`). Sin temporadas: todas matchean.

- Razón del default server-side: la regla de producto "mostrar la última por defecto" vive donde vive el dato; `GET /api/scoreboard` plano siempre devuelve el estado actual del grupo, no un ranking histórico muerto.
- Razón de "sin temporada → primera temporada": las partidas creadas antes de que existieran temporadas (seed, datos reales pre-existentes) son historia anterior a todo; la primera temporada creada las absorbe retroactivamente. Nuevas temporadas arrancan limpias.
- Alternativas descartadas: (a) sin `seasonId` → última temporada: al crear la temporada 2, las partidas viejas sin etiqueta saltarían a ella; (b) sin `seasonId` → invisibles en vistas por temporada: datos que desaparecen de la UI; (c) backfill en migración (reescribir el JSON asignando la primera temporada): efecto colateral en lectura y un paso de migración que el predicate de 2 líneas evita.

### 3. `POST /api/games`: `seasonId` opcional con default a la última

- Omitido → `id` de la temporada más reciente, o `null` si no hay temporadas.
- Enviado → debe ser un entero correspondiente a una temporada existente, si no 400 (`{ "error" }`). La respuesta 201 incluye el `seasonId` asignado.
- La validación de `seasonId` se hace en la ruta de `server.js` (necesita la lista de temporadas del store); `validate.js` no se toca (sigue validando la forma del payload).
- `GET /api/games` normaliza la respuesta agregando `seasonId: null` a las partidas antiguas que no tienen el campo (una línea con spread), para que el contrato de respuesta sea estable.
- `computeScoreboard` no cambia: recibe la lista de partidas ya filtrada.

### 4. Frontend: un solo `selectedSeasonId` en la vista pública

- `PublicView` carga primero `GET /api/seasons`; `selectedSeasonId` = mayor `id` o `null` si no hay. El fetch de ranking+historial usa `?season=<selectedSeasonId>` cuando no es `null`.
- El selector es un `<select>` simple (sin dependencias); al cambiarlo, se refetchea ranking+historial. Si no hay temporadas: sin selector, fetch sin parámetro (hoy).
- `ProtectedView`/`NewGameForm`: el form carga `GET /api/seasons` al montar (endpoint público, barato) y muestra el selector si existe alguna, con default a la más reciente; el body de `postGame` gana `seasonId` (omitido si no hay temporadas).
- Alternativa descartada: levantar las temporadas en `ProtectedView` y pasarlas por props a los dos hijos — acopla el gate a un estado que el form ya puede obtener solo; un fetch por pantalla es suficiente a esta escala.
- Tests frontend: la lógica nueva testeable es mínima (default a la más reciente = `max(id)`); se verifica el resto en el paso de Docker, como en los cambios anteriores.

## Risks / Trade-offs

- [Al crear la primera temporada, la vista por defecto deja de ser "todo el histórico"] → Es el comportamiento pedido ("mostrar el último por defecto"); las partidas antiguas sin etiqueta siguen visibles en la primera temporada. Aceptado.
- [Partidas sin `seasonId` aparecen en la primera temporada aunque el grupo las considere "de antes"] → Regla documentada y testeada; si el grupo quiere re-etiquetar, se agrega un endpoint de edición de partida después (non-goal).
- [`season` inválido responde 404, no lista vacía] → El frontend solo envía ids de la lista viva, así que el 404 solo afecta a uso manual; es más explícito que un vacío silencioso.
- [Full-file sync writes] → Mismo ceiling ya aceptado (`ponytail:` comment en `storage.js`); el cambio no añade escritores.
- [Rollback] → Revertir el código; el campo extra `seasonId` en el JSON es ignorado por el código viejo (la lectura de `raw.games` pasa los campos extra intactos).

## Migration Plan

1. Despliegue: `docker compose up --build` (sin cambios en compose ni nginx).
2. Sin migración de datos: el JSON existente funciona tal cual. Hasta que no exista ninguna temporada, todos los endpoints se comportan exactamente como hoy.
3. Al crear la primera temporada, el default pasa a esa temporada; las partidas antiguas sin `seasonId` se muestran en ella.
4. Rollback: revertir el código; los campos extra son ignorados por la versión anterior.

## Open Questions

- Ninguna bloqueante.
