# Tasks: add-catan-scoreboard

TDD: en cada grupo de backend/frontend, los tests se escriben y ejecutan en rojo ANTES de la implementación correspondiente.

## 1. Setup backend

- [x] 1.1 Crear `backend/` con `package.json` (Node 20, `"type": "module"`, script `test` usando `node --test`), sin dependencias runtime
- [x] 1.2 Verificar que `npm test` corra el runner de `node:test` (test trivial que pasa)

## 2. Storage (TDD)

- [x] 2.1 Escribir tests en rojo: seed al arrancar sin archivo (≥3 partidas, ≥3 jugadores, alguno con 10 pts), no re-seedear si el archivo existe (incluyendo `{ "games": [] }`), read/append de partidas
- [x] 2.2 Escribir tests en rojo: archivo ausente o corrupto en lectura → lista vacía (no 500); escritura válida tras corrupción → JSON válido
- [x] 2.3 Implementar `backend/src/storage.js` hasta que todos los tests de storage pasen (ruta configurable por parámetro/variable de entorno para tests)

## 3. Agregación del scoreboard (TDD)

- [x] 3.1 Escribir tests en rojo: `totalPoints`, `gamesPlayed`, `wins` (mayor puntaje de la partida; empate de máximo → 0 victorias para ambos), orden por totalPoints descendente, lista vacía → `[]`
- [x] 3.2 Escribir tests en rojo: agrupación por nombre con lowercase+trim y primera capitalización vista como display name
- [x] 3.3 Implementar `backend/src/scoreboard.js` hasta que todos los tests de agregación pasen

## 4. Validación y API (TDD)

- [x] 4.1 Escribir tests en rojo de validación: players ausente/vacía/no lista → 400; name vacío o no texto → 400; points no número finito ≥ 0 → 400; body no JSON → 400; body válido pasa
- [x] 4.2 Escribir tests en rojo de endpoints (server en puerto efímero + fetch contra dir temporal): GET /api/scoreboard, GET /api/games (orden id descendente), POST /api/games (201 + id auto-incremental + fecha actual si omite date + persistencia), respuesta 400 con `{ error }`
- [x] 4.3 Escribir tests en rojo: sin auth en todos los endpoints; CORS `Access-Control-Allow-Origin: *` y pre-flight OPTIONS (Allow-Methods GET/POST, Allow-Headers Content-Type)
- [x] 4.4 Implementar `backend/src/server.js` (http puro + router ~30 líneas) y `backend/src/index.js` (bootstrap: seed + listen en 3001) hasta que todos los tests de API pasen

## 5. Setup frontend

- [x] 5.1 Crear `frontend/` con Vite + React (npm create vite), script `test` con vitest
- [x] 5.2 Configurar `VITE_API_URL` (default: mismo origen) y helper de fetch de la API

## 6. Lógica frontend (TDD)

- [x] 6.1 Escribir tests en rojo con vitest: validación client-side del form (nombre vacío → error; puntaje negativo o no numérico → error; lista vacía → error)
- [x] 6.2 Implementar la lógica de validación del form hasta que los tests pasen

## 7. Vistas frontend

- [x] 7.1 Implementar vista de ranking (scoreboard): tabla con nombre, totalPoints, gamesPlayed, wins; mensaje vacío si no hay partidas; mensaje de error si la API falla
- [x] 7.2 Implementar historial de partidas: fecha + players con puntos, orden de la API
- [x] 7.3 Implementar formulario de nueva partida: filas dinámicas jugador/puntaje (agregar/quitar), fecha opcional, envío a POST /api/games, en éxito refresca scoreboard + historial y limpia el form, muestra error de la API si 400
- [x] 7.4 CSS plano básico para las tres secciones

## 8. Docker

- [x] 8.1 `backend/Dockerfile` (node:20-alpine, copia el código, CMD node src/index.js)
- [x] 8.2 `frontend/Dockerfile` multi-stage (build Vite → nginx:alpine con reverse proxy `/api` → backend:3001)
- [x] 8.3 `docker-compose.yml` en la raíz: servicio backend (puerto 3001, volumen `./backend/data:/app/data`), servicio frontend (puerto 8080), misma red
- [x] 8.4 `.dockerignore` en backend/ y frontend/ (node_modules, data)

## 9. Verificación final

- [x] 9.1 Ejecutar `npm test` en backend/ y frontend/: todo verde
- [x] 9.2 `docker compose up --build`: UI en :8080 muestra el seed del ranking; registrar una partida desde la UI la persiste (verificar `backend/data/scoreboard.json`)
- [x] 9.3 Reiniciar contenedores y confirmar que la partida registrada persiste
- [x] 9.4 `openspec validate add-catan-scoreboard` sin errores
