# Design: add-catan-scoreboard

## Context

Repo nuevo y vacío (solo hay `openspec/`). Necesitamos un scoreboard de Catan levantable con `docker compose up`: backend Node sin auth, frontend React, datos en un JSON local con seed de ejemplo. No hay usuarios, login ni multi-tenant: es una app de una sola partida de grupo, tipicamente en LAN.

## Goals / Non-Goals

**Goals:**
- Registrar una partida: fecha + puntaje de cada jugador.
- Mostrar el scoreboard: listado de jugadores con puntaje total, partidos jugados y victorias (quién llegó primero a 10).
- Persistir todo en un archivo JSON local, precargado con datos de ejemplo si no existe.
- `docker compose up` levanta todo; la UI queda en un puerto y la API en otro.
- TDD: tests antes de la implementación de toda la lógica (validación, agregación, persistencia, endpoints, y la lógica del frontend).

**Non-Goals:**
- Autenticación, roles o multi-sala.
- Editar/borrar partidas (solo lectura + alta).
- Base de datos real (Postgres, etc.), filas concurrentes de alto volumen, despliegue a la nube.

## Decisions

### 1. Data model: una sola lista de partidas, scoreboard derivado

```json
{ "games": [ { "id": 1, "date": "2026-08-20", "players": [ { "name": "Ana", "points": 10 }, { "name": "Beto", "points": 7 } ] } ] }
```

- Sin tabla de jugadores separada: el scoreboard se deriva agregando por nombre (lowercase + trim para agrupar; se muestra la primera capitalización vista).
- `id`: entero auto-incremental (`max(id)+1`).
- Alternativa descartada: tabla `players` con ids — más código y más validaciones para nada que la app use.

### 2. Backend: Node `http` puro, sin framework

3 endpoints, un solo módulo de storage. Un router de ~30 líneas sobre `http.createServer` evita la dependencia Express sin perder legibilidad.

- Endpoints:
  - `GET /api/scoreboard` → `[{ name, totalPoints, gamesPlayed, wins }]` ordenado por totalPoints desc.
  - `GET /api/games` → lista de partidas (más reciente primero).
  - `POST /api/games` → body `{ date?, players: [{name, points}] }`; valida: players no vacío, name no vacío, points número ≥ 0; responde 201 con la partida creada o 400 con `{ error }`.
- CORS abierto (`Access-Control-Allow-Origin: *`) para que la UI pueda llamarla desde otro origen/puerto.

Alternativa descartada: Express — una dependencia para 3 rutas no se justifica.

### 3. Tests backend: `node:test` + `fetch` (stdlib)

Node 20 trae `node --test` y `fetch` globales: cero dependencias de test.

- Tests de módulo: storage (seed, read, append), agregación del scoreboard, validación.
- Tests de API: levantan el server en puerto efímero y golpean con `fetch` contra un directorio de datos temporal.

### 4. Frontend: Vite + React, sin librerías extra

- Un solo view (sin router): ranking arriba, historial de partidas abajo, form para registrar partida.
- Estado con `useState`/`useEffect` + `fetch`. Sin state library, sin UI kit: CSS plano propio.
- `VITE_API_URL` (default: mismo origen). En Docker, nginx hace reverse proxy de `/api` → `backend:3001`, de modo que la UI funciona desde cualquier host sin depender de DNS de Docker en el navegador. Fuera de Docker (dev), un proxy de Vite apunta `/api` → `http://localhost:3001`.

### 5. Tests frontend: vitest para la lógica pura

La lógica del frontend es delgada; se testean las funciones puras (normalización de nombres del form, validación client-side, formateo) con vitest. Sin testing-library de componentes: el render es directo de datos ya validados por el server.

Alternativa descartada: React Testing Library + jsdom — setup pesado para una view que solo pinta listas.

### 6. Docker: compose con 2 servicios + volumen de datos

- `backend`: `node:20-alpine`, expone 3001, volumen `./backend/data:/app/data` para que el JSON sobreviva al contenedor.
- `frontend`: multi-stage (build con Vite → `nginx:alpine` sirviendo el static), expone 8080.
- La UI y la API hablan vía el nombre de servicio de la red de compose.

### 7. Seed de datos

Si `data/scoreboard.json` no existe, el storage lo crea con ~3 partidas de ejemplo (4 jugadores) al arrancar. El seed vive como constante en el código, no como fixture separado.

## Risks / Trade-offs

- [Escrituras concurrentes corrompen el JSON] → Single-process Node; en la escala de esta app (un grupo anotando partidas) una `writeFile` completa por operación es suficiente. Si alguna vez importamos datos en lote, migrar a atómico (escribir a temp + rename).
- [Nombres con distintas mayúsculas/acentos se duplican en el ranking] → Agrupación con lowercase+trim; el acento se deja tal cual (no normalizar diacríticos: false positive más probable que el caso real).
- [Los datos viven en un solo archivo] → El volumen de Docker es la única fuente de verdad; documentar en el README que respaldar `backend/data/` es respaldar la app.

## Migration Plan

1. Levantar con `docker compose up --build`.
2. Verificar: `GET /api/scoreboard` devuelve el seed; la UI en `:8080` muestra el ranking.
3. Rollback: borrar los contenedores; el único estado es `backend/data/scoreboard.json`, que se puede borrar para re-seedear.

## Open Questions

- Ninguna bloqueante. Si más adelante queremos editar/borrar partidas, se añaden `PUT`/`DELETE` sin cambiar el modelo de datos.
