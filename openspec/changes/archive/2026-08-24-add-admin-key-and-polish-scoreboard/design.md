# Design: add-admin-key-and-polish-scoreboard

## Context

El scoreboard de Catan ya existe (cambio `add-catan-scoreboard`): backend Node `http` puro sin deps, un solo JSON (`{ games: [...] }`) con seed, frontend React + Vite servido por nginx con reverse proxy de `/api`. El formulario de partida vive en la misma pantalla pública que el ranking y `POST /api/games` no exige nada.

## Goals / Non-Goals

**Goals:**
- Registrar partidas queda restringido a quien tiene la clave de admin, tanto en la UI (`/nueva-partida`) como en la API.
- El admin puede cambiar la clave desde la propia pantalla protegida.
- El ranking se ve llamativo (podio top 3, tarjetas, paleta fuerte).
- TDD en toda la lógica nueva.

**Non-Goals:**
- Login de usuarios, sesiones/token JWT, roles múltiples.
- Rate limiting o bloqueo por intentos fallidos.
- Migrar de JSON a BD, multi-sala, edición/borrado de partidas.

## Decisions

### 1. La clave vive en el mismo archivo de datos, como hash SHA-256

El archivo pasa a `{ "games": [...], "adminKeyHash": "<hex sha256>" }`.

- Mismo file: un solo volumen, un solo lugar para respaldar, sin config extra.
- Hash (no plaintext): la clave no aparece legible en el file; comparar `sha256(input) === hash` con `crypto.timingSafeEqual` (mismo largo siempre, 64 hex chars) evita timing attack.
- Clave por defecto del seed: `catan` (se loguea en el arranque para recordarle al admin que la cambie).
- Backward compat: archivo existente sin `adminKeyHash` → se trata como el hash de la clave por defecto; la siguiente escritura lo persiste.
- Alternativas descartadas: env var (no editable desde la UI), file de config aparte (un file más sin razón), plaintext en el JSON.

### 2. Endpoints de admin

- `POST /api/admin/verify` — body `{ "key": "..." }` → 200 `{ "ok": true }` o 401 `{ "error": "..." }`.
- `POST /api/admin/key` — body `{ "currentKey", "newKey" }` → 200 `{ "ok": true }` si currentKey es válida y newKey es válida (texto, trim, ≥ 4 chars); 401 si currentKey es inválida; 400 si newKey es inválida.
- La UI usa verify al entrar y key al cambiar. No hay sesiones: la clave viaja en cada request (ver 3).

### 3. `POST /api/games` exige el header `X-Admin-Key`

- Header (no body): el payload de partida sigue siendo puro; el gate es transversal.
- Sin header o inválido → 401 `{ "error": "clave requerida" }`, evaluado ANTES de la validación del body (401 gana sobre 400).
- CORS: `Access-Control-Allow-Headers` pasa a incluir `X-Admin-Key` (el pre-flight actual solo permite Content-Type; el navegador bloquearía el header custom).
- `GET /api/scoreboard` y `GET /api/games` siguen siendo públicos: el ranking es para mostrarlo, la escritura es lo que se protege.

### 4. Frontend: react-router-dom + gate de clave con sessionStorage

- Nuevas rutas: `/` (ranking público + historial) y `/nueva-partida` (protegida). La dependencia `react-router-dom` es el estándar; el manual hash-router era más código para menos compatibilidad.
- `KeyGate` envuelve la pantalla protegida: si `sessionStorage` no tiene clave → formulario de clave; envía a `/api/admin/verify`; en 200 guarda la clave en `sessionStorage` y muestra el form de partida; en 401 muestra error.
- El form de partida incluye la clave en el header de `POST /api/games`; si la API responde 401 (clave cambiada desde otra sesión), se limpia `sessionStorage` y vuelve a pedir clave.
- Cambio de clave: sección colapsable en la pantalla protegida (clave actual + nueva, con validación client-side ≥ 4 chars) → `POST /api/admin/key` → en éxito actualiza `sessionStorage`.
- `sessionStorage` (no localStorage): al cerrar la pestaña pide clave de nuevo; la clave es de sesión, no persistida en el navegador.
- Deep links: nginx ya tiene `try_files $uri /index.html` → refrescar en `/nueva-partida` funciona.
- Alternativa descartada: guardar la clave en localStorage (persistiría más de lo necesario).

### 5. Diseño llamativo: CSS propio, sin UI kit

- Fondo con gradiente oscuro, tarjetas con elevación, números grandes en el ranking.
- Podio top 3: las 3 primeras filas se renderizan como tarjetas de podio con acentos oro/plata/bronce y posición (1º/2º/3º); el resto queda en la lista.
- Todo CSS plano en `index.css` (sigue sin librería de estilos): un kit de componentes para 3 vistas es overkill.
- La lógica del ranking no cambia: mismo orden de la API, mismo dato; solo presentación.

### 6. TDD

- Backend (`node:test`): tests de storage (hash, default, set, backward compat), tests de endpoints (401 en POST /api/games con/ sin clave, precedence 401>400, verify, key change 200/401/400), CORS con el nuevo header.
- Frontend (vitest): validación client-side del form de cambio de clave (pura, testeable); el resto (gate, router) se verifica en el paso de Docker.

## Risks / Trade-offs

- [Brute force de la clave vía API] → Comparación en tiempo constante + app en LAN; sin rate limiting (YAGNI, se anota el ceiling con un `ponytail:` comment en el code).
- [La clave viaja en header en cada request] → En LAN sobre HTTP es aceptable; si la app saliera a internet, subir a HTTPS + sesiones (fuera de scope).
- [sessionStorage compartida entre pestañas del navegador] → Aceptable: la protección es contra anotar partidas por casualidad, no contra un atacante con el navegador.
- [Archivos de datos antiguos sin hash] → Se resuelve con default + persistir en la próxima escritura (test explícito de backward compat).

## Migration Plan

1. Despliegue: `docker compose up --build` (sin cambios en compose).
2. El file existente de datos funciona tal cual; la primera escritura (cambiar clave o registrar) agrega `adminKeyHash`.
3. Si el admin nunca cambió la clave, sigue siendo la por defecto (`catan`) — el log del backend lo recuerda.
4. Rollback: revertir el código; el campo extra en el JSON es ignorado por el código viejo.

## Open Questions

- Ninguna bloqueante.
