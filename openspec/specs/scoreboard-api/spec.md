# Spec: scoreboard-api

## Purpose

API REST del scoreboard de Catan: endpoints para listar el ranking agregado, listar partidas y registrar nuevas partidas, sin autenticación y con CORS abierto.

## Requirements

### Requirement: Listar scoreboard agregado
El sistema SHALL exponer `GET /api/scoreboard` que devuelve el listado de jugadores agregado sobre todas las partidas registradas, ordenado por puntaje total descendente. Cada entrada SHALL contener: `name`, `totalPoints` (suma de puntos en todas las partidas), `gamesPlayed` (cantidad de partidas jugadas) y `wins` (partidas donde el jugador fue el de mayor puntaje; en caso de empate de máximo, ninguna de las entradas empatadas cuenta victoria).

#### Scenario: Scoreboard con varias partidas
- **WHEN** existen partidas donde "Ana" sumó 10 y 8 puntos y "Beto" sumó 7 y 12 puntos
- **THEN** `GET /api/scoreboard` devuelve `[{name: "Beto", totalPoints: 19, gamesPlayed: 2, wins: 1}, {name: "Ana", totalPoints: 18, gamesPlayed: 2, wins: 1}]`

#### Scenario: Agrupación de nombres insensible a mayúsculas y espacios
- **WHEN** una partida registra "  Ana " con 5 puntos y otra registra "ana" con 3 puntos
- **THEN** el scoreboard muestra una sola entrada "Ana" (primera capitalización vista) con `totalPoints: 8` y `gamesPlayed: 2`

#### Scenario: Scoreboard sin partidas
- **WHEN** no hay partidas registradas
- **THEN** `GET /api/scoreboard` responde 200 con una lista vacía

### Requirement: Listar partidas
El sistema SHALL exponer `GET /api/games` que devuelve todas las partidas registradas, de la más reciente (mayor `id`) a la más antigua. Cada partida SHALL contener `id`, `date` y la lista de `players` con `name` y `points`.

#### Scenario: Partidas en orden descendente
- **WHEN** se registraron las partidas con id 1, 2 y 3
- **THEN** `GET /api/games` las devuelve en el orden 3, 2, 1

### Requirement: Registrar nueva partida
El sistema SHALL exponer `POST /api/games` que acepta un JSON body `{ date?, players: [{ name, points }] }` junto con el header `X-Admin-Key` conteniendo la clave de admin. Si el header falta o no es la clave vigente, el sistema SHALL responder 401 con `{ "error": "<mensaje>" }` sin procesar el body, incluso si el body también es inválido. Con clave válida, el sistema persiste la partida con un `id` auto-incremental y devuelve 201 con la partida creada. `date` es opcional; si no se envía, el sistema SHALL usar la fecha actual (YYYY-MM-DD).

#### Scenario: Registro válido con clave
- **WHEN** se envía `POST /api/games` con header `X-Admin-Key` correcto y body `{ "date": "2026-08-24", "players": [{"name": "Ana", "points": 10}, {"name": "Beto", "points": 5}] }`
- **THEN** el sistema responde 201 con la partida creada, incluyendo `id`, `date` y los players enviados
- **AND** la partida aparece en `GET /api/games` y en el scoreboard

#### Scenario: Sin clave
- **WHEN** se envía `POST /api/games` sin el header `X-Admin-Key`
- **THEN** el sistema responde 401 con un `{ "error" }` y no se registra ninguna partida

#### Scenario: Clave inválida tiene precedencia sobre body inválido
- **WHEN** se envía `POST /api/games` con `X-Admin-Key` incorrecto y un body inválido (por ejemplo `players` vacía)
- **THEN** el sistema responde 401 (no 400)

#### Scenario: Fecha omitida
- **WHEN** se envía `POST /api/games` con clave válida y sin el campo `date`
- **THEN** el sistema responde 201 asignando la fecha actual (YYYY-MM-DD) a la partida

### Requirement: Validación del registro de partida
El sistema SHALL rechazar con 400 y body `{ "error": "<mensaje>" }` los registros inválidos: `players` ausente, vacía o no lista; algún `name` vacío o no texto; algún `points` que no sea un número finito ≥ 0; o body que no sea JSON válido.

#### Scenario: Players vacía
- **WHEN** se envía `POST /api/games` con `{ "players": [] }`
- **THEN** el sistema responde 400 con un error indicando que la partida necesita al menos un jugador

#### Scenario: Puntaje inválido
- **WHEN** se envía `POST /api/games` con un player cuyo `points` es `-3`, `"diez"` o falta
- **THEN** el sistema responde 400 con un error indicando que el puntaje debe ser un número ≥ 0

#### Scenario: Nombre vacío
- **WHEN** se envía `POST /api/games` con un player cuyo `name` es `""` o `   `
- **THEN** el sistema responde 400 con un error indicando que el nombre es requerido

#### Scenario: Body no JSON
- **WHEN** se envía `POST /api/games` con un body que no es JSON válido
- **THEN** el sistema responde 400 con un error indicando que el body debe ser JSON

### Requirement: Acceso sin autenticación y CORS
El sistema SHALL responder a los endpoints de lectura (`GET /api/scoreboard`, `GET /api/games`) y a `POST /api/admin/verify` sin exigir credenciales previas, y SHALL incluir los headers CORS `Access-Control-Allow-Origin: *` y `Access-Control-Allow-Methods` incluyendo GET/POST en las respuestas. La verificación de la clave de admin (`X-Admin-Key`) SHALL requerirse solo en `POST /api/games` y como `currentKey` en `POST /api/admin/key`. El pre-flight CORS SHALL permitir además el header `X-Admin-Key` en `Access-Control-Allow-Headers`.

#### Scenario: Llamada de lectura sin credenciales
- **WHEN** se realiza `GET /api/scoreboard` sin headers de autenticación
- **THEN** el sistema responde 200 normalmente

#### Scenario: Pre-flight CORS con header de clave
- **WHEN** se envía una request `OPTIONS` a `POST /api/games` con `Access-Control-Request-Headers: X-Admin-Key`
- **THEN** el sistema responde con headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods` incluyendo GET/POST y `Access-Control-Allow-Headers` incluyendo `Content-Type` y `X-Admin-Key`

### Requirement: Verificación de la clave de administrador
El sistema SHALL exponer `POST /api/admin/verify` que acepta un JSON body `{ "key": "<texto>" }` y responde 200 con `{ "ok": true }` si la clave coincide con la clave de admin almacenada, o 401 con `{ "error": "<mensaje>" }` si no coincide, falta o no es texto. La comparación SHALL realizarse en tiempo constante (sin early-exit por prefijo).

#### Scenario: Clave correcta
- **WHEN** se envía `POST /api/admin/verify` con la clave almacenada
- **THEN** el sistema responde 200 con `{ "ok": true }`

#### Scenario: Clave incorrecta o ausente
- **WHEN** se envía `POST /api/admin/verify` con una clave distinta, sin el campo `key` o con `key` no texto
- **THEN** el sistema responde 401 con un `{ "error" }` descriptivo

### Requirement: Cambio de la clave de administrador
El sistema SHALL exponer `POST /api/admin/key` que acepta un JSON body `{ "currentKey": "<texto>", "newKey": "<texto>" }` y, si `currentKey` es la clave vigente, persiste el hash de `newKey` como nueva clave de admin respondiendo 200 con `{ "ok": true }`. Si `currentKey` no es la clave vigente, responde 401. Si `newKey` no es texto o tiene menos de 4 caracteres (tras trim), responde 400 con `{ "error" }` sin modificar la clave.

#### Scenario: Cambio exitoso
- **WHEN** se envía `POST /api/admin/key` con la `currentKey` correcta y una `newKey` válida (≥ 4 chars)
- **THEN** el sistema responde 200 y las requests posteriores usan la nueva clave (la anterior deja de ser válida en `POST /api/games` y `POST /api/admin/verify`)

#### Scenario: Clave actual incorrecta
- **WHEN** se envía `POST /api/admin/key` con `currentKey` inválida
- **THEN** el sistema responde 401 y la clave almacenada no se modifica

#### Scenario: Nueva clave inválida
- **WHEN** se envía `POST /api/admin/key` con `currentKey` correcta pero `newKey` vacía, con menos de 4 chars o no texto
- **THEN** el sistema responde 400 con un `{ "error" }` y la clave almacenada no se modifica
