# Spec: scoreboard-api

## ADDED Requirements

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
El sistema SHALL exponer `POST /api/games` que acepta un JSON body `{ date?, players: [{ name, points }] }`, persiste la partida con un `id` auto-incremental y devuelve 201 con la partida creada. `date` es opcional; si no se envía, el sistema SHALL usar la fecha actual (YYYY-MM-DD).

#### Scenario: Registro válido
- **WHEN** se envía `POST /api/games` con `{ "date": "2026-08-24", "players": [{"name": "Ana", "points": 10}, {"name": "Beto", "points": 5}] }`
- **THEN** el sistema responde 201 con la partida creada, incluyendo `id`, `date` y los players enviados
- **AND** la partida aparece en `GET /api/games` y en el scoreboard

#### Scenario: Fecha omitida
- **WHEN** se envía `POST /api/games` sin el campo `date`
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
El sistema SHALL responder a todos los endpoints sin exigir credenciales ni tokens, y SHALL incluir el header `Access-Control-Allow-Origin: *` en las respuestas de la API para permitir el acceso desde el frontend en otro origen.

#### Scenario: Llamada sin credenciales
- **WHEN** se realiza `GET /api/scoreboard` sin headers de autenticación
- **THEN** el sistema responde 200 normalmente

#### Scenario: Pre-flight CORS
- **WHEN** se envía una request `OPTIONS` a cualquier endpoint de la API
- **THEN** el sistema responde con headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods` incluyendo GET/POST y `Access-Control-Allow-Headers` incluyendo Content-Type
