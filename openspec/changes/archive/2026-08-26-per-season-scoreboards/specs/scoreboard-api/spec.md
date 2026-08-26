# Spec: scoreboard-api

## MODIFIED Requirements

### Requirement: Listar scoreboard agregado
El sistema SHALL exponer `GET /api/scoreboard` que devuelve el listado de jugadores agregado sobre un subconjunto de partidas, ordenado por puntaje total descendente. Cada entrada SHALL contener: `name`, `totalPoints` (suma de puntos en todas las partidas consideradas), `gamesPlayed` (cantidad de partidas jugadas) y `wins` (partidas donde el jugador fue el de mayor puntaje; en caso de empate de máximo, ninguna de las entradas empatadas cuenta victoria).

El endpoint SHALL aceptar un query param opcional `season=<id>`:
- Si `season` corresponde al `id` de una temporada existente: el agregado SHALL considerar solo las partidas de esa temporada.
- Si `season` no es un número entero positivo o no corresponde a una temporada existente: el sistema SHALL responder 404 con `{ "error": "<mensaje>" }`.
- Si no se envía `season`: si existen temporadas, el sistema SHALL considerar las partidas de la temporada más reciente (mayor `id`); si no hay temporadas, SHALL considerar todas las partidas.

Las partidas sin `seasonId` (creadas antes de que existieran temporadas) SHALL contar para la primera temporada (menor `id`), incluida cuando la primera temporada es la que resuelve el filtro.

#### Scenario: Scoreboard con varias partidas sin temporadas
- **WHEN** no hay temporadas creadas y existen partidas donde "Ana" sumó 10 y 8 puntos y "Beto" sumó 7 y 12 puntos
- **THEN** `GET /api/scoreboard` devuelve `[{name: "Beto", totalPoints: 19, gamesPlayed: 2, wins: 1}, {name: "Ana", totalPoints: 18, gamesPlayed: 2, wins: 1}]`

#### Scenario: Scoreboard de una temporada específica
- **WHEN** existen las temporadas id 1 y 2, la temporada 1 tiene una partida donde "Ana" sumó 10 y la temporada 2 una donde "Beto" sumó 10
- **THEN** `GET /api/scoreboard?season=1` devuelve solo la entrada de "Ana" (`totalPoints: 10`, `gamesPlayed: 1`, `wins: 1`)
- **AND** `GET /api/scoreboard?season=2` devuelve solo la entrada de "Beto"

#### Scenario: Por defecto se usa la temporada más reciente
- **WHEN** existen las temporadas id 1 y 2 con partidas en cada una
- **THEN** `GET /api/scoreboard` sin el parámetro `season` devuelve el ranking calculado solo sobre las partidas de la temporada 2

#### Scenario: Partidas sin temporada cuentan para la primera
- **WHEN** existen las temporadas id 1 y 2, una partida sin `seasonId` donde "Ana" sumó 7 y una partida de la temporada 2 donde "Beto" sumó 10
- **THEN** `GET /api/scoreboard?season=1` devuelve solo a "Ana" (`totalPoints: 7`)
- **AND** `GET /api/scoreboard?season=2` devuelve solo a "Beto"

#### Scenario: Parámetro season inválido
- **WHEN** se realiza `GET /api/scoreboard?season=999` (id inexistente) o `GET /api/scoreboard?season=abc`
- **THEN** el sistema responde 404 con un `{ "error" }` descriptivo

#### Scenario: Agrupación de nombres insensible a mayúsculas y espacios
- **WHEN** una partida registra "  Ana " con 5 puntos y otra registra "ana" con 3 puntos
- **THEN** el scoreboard muestra una sola entrada "Ana" (primera capitalización vista) con `totalPoints: 8` y `gamesPlayed: 2`

#### Scenario: Scoreboard sin partidas
- **WHEN** no hay partidas registradas, o la temporada resuelta no tiene partidas
- **THEN** `GET /api/scoreboard` responde 200 con una lista vacía

### Requirement: Listar partidas
El sistema SHALL exponer `GET /api/games` que devuelve las partidas registradas, de la más reciente (mayor `id`) a la más antigua, aplicando la misma resolución de temporada que `GET /api/scoreboard`: query param opcional `season=<id>` (404 si es inválido o inexistente), y sin el parámetro la temporada más reciente si existen temporadas o todas las partidas si no hay. Cada partida SHALL contener `id`, `date`, `seasonId` (number o `null`) y la lista de `players` con `name` y `points`.

#### Scenario: Partidas en orden descendente sin temporadas
- **WHEN** no hay temporadas y se registraron las partidas con id 1, 2 y 3
- **THEN** `GET /api/games` las devuelve en el orden 3, 2, 1

#### Scenario: Partidas de una temporada
- **WHEN** la temporada 1 tiene las partidas id 1 y 2 y la temporada 2 la partida id 3
- **THEN** `GET /api/games?season=1` devuelve en el orden 2, 1 y `GET /api/games?season=2` devuelve la partida 3

#### Scenario: Por defecto la temporada más reciente
- **WHEN** existen las temporadas id 1 y 2 con partidas en cada una
- **THEN** `GET /api/games` sin el parámetro `season` devuelve solo las partidas de la temporada 2

#### Scenario: Parámetro season inválido
- **WHEN** se realiza `GET /api/games?season=999` (id inexistente)
- **THEN** el sistema responde 404 con un `{ "error" }` descriptivo

### Requirement: Registrar nueva partida
El sistema SHALL exponer `POST /api/games` que acepta un JSON body `{ date?, seasonId?, players: [{ name, points }] }` junto con el header `X-Admin-Key` conteniendo la clave de admin. Si el header falta o no es la clave vigente, el sistema SHALL responder 401 con `{ "error": "<mensaje>" }` sin procesar el body, incluso si el body también es inválido. Con clave válida, el sistema persiste la partida con un `id` auto-incremental y devuelve 201 con la partida creada, incluyendo su `seasonId`. `date` es opcional; si no se envía, el sistema SHALL usar la fecha actual (YYYY-MM-DD). `seasonId` es opcional: si se omite, el sistema SHALL asignar el `id` de la temporada más reciente si existen temporadas, o `null` si no hay; si se envía, SHALL corresponder a una temporada existente (ver validación).

#### Scenario: Registro válido con clave
- **WHEN** se envía `POST /api/games` con header `X-Admin-Key` correcto y body `{ "date": "2026-08-24", "players": [{"name": "Ana", "points": 10}, {"name": "Beto", "points": 5}] }`
- **THEN** el sistema responde 201 con la partida creada, incluyendo `id`, `date`, `seasonId` y los players enviados
- **AND** la partida aparece en `GET /api/games` y en el scoreboard de la temporada asignada

#### Scenario: Sin seasonId con temporadas existentes
- **WHEN** existen las temporadas id 1 y 2 y se envía `POST /api/games` con clave válida y sin el campo `seasonId`
- **THEN** el sistema responde 201 con la partida creada con `seasonId: 2`

#### Scenario: Sin seasonId sin temporadas
- **WHEN** no hay temporadas y se envía `POST /api/games` con clave válida y sin el campo `seasonId`
- **THEN** el sistema responde 201 con la partida creada con `seasonId: null`

#### Scenario: Con seasonId existente
- **WHEN** existen las temporadas id 1 y 2 y se envía `POST /api/games` con clave válida y `seasonId: 1`
- **THEN** el sistema responde 201 con la partida creada con `seasonId: 1`
- **AND** la partida aparece en `GET /api/scoreboard?season=1` y no en `GET /api/scoreboard?season=2`

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
El sistema SHALL rechazar con 400 y body `{ "error": "<mensaje>" }` los registros inválidos: `players` ausente, vacía o no lista; algún `name` vacío o no texto; algún `points` que no sea un número finito ≥ 0; `seasonId` presente que no sea un número entero o que no corresponda a una temporada existente; o body que no sea JSON válido.

#### Scenario: Players vacía
- **WHEN** se envía `POST /api/games` con `{ "players": [] }`
- **THEN** el sistema responde 400 con un error indicando que la partida necesita al menos un jugador

#### Scenario: Puntaje inválido
- **WHEN** se envía `POST /api/games` con un player cuyo `points` es `-3`, `"diez"` o falta
- **THEN** el sistema responde 400 con un error indicando que el puntaje debe ser un número ≥ 0

#### Scenario: Nombre vacío
- **WHEN** se envía `POST /api/games` con un player cuyo `name` es `""` o `   `
- **THEN** el sistema responde 400 con un error indicando que el nombre es requerido

#### Scenario: seasonId inexistente
- **WHEN** se envía `POST /api/games` con clave válida y `seasonId: 999` (temporada que no existe)
- **THEN** el sistema responde 400 con un error indicando que la temporada no existe y no se registra la partida

#### Scenario: seasonId no numérica
- **WHEN** se envía `POST /api/games` con clave válida y `seasonId: "1"`
- **THEN** el sistema responde 400 con un error indicando que `seasonId` debe ser un número y no se registra la partida

#### Scenario: Body no JSON
- **WHEN** se envía `POST /api/games` con un body que no es JSON válido
- **THEN** el sistema responde 400 con un error indicando que el body debe ser JSON
