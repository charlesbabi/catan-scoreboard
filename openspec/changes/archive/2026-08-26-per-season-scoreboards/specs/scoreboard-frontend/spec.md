# Spec: scoreboard-frontend

## MODIFIED Requirements

### Requirement: Mostrar ranking de jugadores
La pantalla pública (`/`) SHALL consultar `GET /api/seasons` al cargar. Si existen temporadas, la UI SHALL mostrar un selector de temporadas con la más reciente (mayor `id`) seleccionada por defecto y SHALL consultar `GET /api/scoreboard?season=<id>` para la temporada seleccionada, mostrando el listado de jugadores con su puntaje total, partidos jugados y victorias, en el orden que devuelve la API (puntaje total descendente). Al cambiar la selección, la UI SHALL recargar el ranking (y el historial) de la nueva temporada. Si no hay temporadas, la UI SHALL no mostrar el selector y SHALL consultar `GET /api/scoreboard` sin parámetro (todas las partidas), conservando el comportamiento actual.

#### Scenario: Carga inicial sin temporadas
- **WHEN** la app se carga, no hay temporadas y la API devuelve 3 jugadores
- **THEN** la UI no muestra selector de temporadas y muestra los 3 jugadores con `totalPoints`, `gamesPlayed` y `wins`, en el mismo orden que la API

#### Scenario: Carga inicial con temporadas
- **WHEN** la app se carga y existen 2 temporadas con partidas en cada una
- **THEN** la UI muestra el selector de temporadas con la más reciente seleccionada por defecto
- **AND** el ranking mostrado corresponde solo a las partidas de la temporada más reciente

#### Scenario: Cambio de temporada recarga el ranking
- **WHEN** el usuario selecciona una temporada anterior en el selector
- **THEN** la UI consulta el scoreboard de esa temporada y muestra su ranking en lugar del anterior

#### Scenario: Temporada seleccionada sin partidas
- **WHEN** el usuario selecciona una temporada que no tiene partidas
- **THEN** la UI muestra el mensaje indicando que aún no hay partidas registradas

#### Scenario: Sin partidas registradas
- **WHEN** la API devuelve un scoreboard vacío
- **THEN** la UI muestra un mensaje indicando que aún no hay partidas registradas

#### Scenario: Fallo de conexión a la API
- **WHEN** la API no responde o devuelve un error HTTP
- **THEN** la UI muestra un mensaje de error legible en lugar de quedar en blanco o crashear

### Requirement: Mostrar historial de partidas
El frontend SHALL consultar `GET /api/games` con la misma resolución de temporada que el ranking (parámetro `season=<id>` de la temporada seleccionada, o sin parámetro si no hay temporadas) y mostrar el historial de partidas con la fecha y el puntaje de cada jugador en cada partida, actualizándolo al cambiar de temporada.

#### Scenario: Historial con varias partidas sin temporadas
- **WHEN** no hay temporadas y la API devuelve 2 partidas
- **THEN** la UI muestra ambas con su fecha y la lista de jugadores con sus puntos

#### Scenario: Historial de la temporada seleccionada
- **WHEN** existen 2 temporadas con partidas en cada una y la temporada seleccionada tiene 2 partidas
- **THEN** la UI muestra solo las 2 partidas de la temporada seleccionada
- **AND** al cambiar la selección, el historial se actualiza con las partidas de la nueva temporada

### Requirement: Registrar nueva partida desde la UI
El frontend SHALL mostrar el formulario para registrar una nueva partida (fecha opcional, temporada y una lista dinámica de filas jugador/puntaje) únicamente en la URL `/nueva-partida`, tras el acceso con la clave de administrador. Si existen temporadas, el formulario SHALL incluir un selector de temporada cargado con `GET /api/seasons`, con la más reciente seleccionada por defecto. Al enviar, la UI SHALL llamar a `POST /api/games` incluyendo la clave en el header `X-Admin-Key` y el `seasonId` de la temporada seleccionada en el body (omitido si no hay temporadas); en éxito, refrescar el scoreboard y el historial. La pantalla pública (`/`) no incluirá el formulario de registro; en su lugar enlazará a `/nueva-partida`.

#### Scenario: Registro exitoso
- **WHEN** el usuario autenticado agrega 2 filas (nombre + puntaje), las completa y envía
- **THEN** la UI muestra confirmación de éxito, el scoreboard y el historial se actualizan con la nueva partida y el formulario se limpia

#### Scenario: Formulario con temporadas
- **WHEN** el usuario autenticado abre `/nueva-partida` y existen 2 temporadas
- **THEN** el formulario muestra el selector de temporada con la más reciente seleccionada por defecto
- **AND** al enviar, el body de `POST /api/games` incluye el `seasonId` de la temporada seleccionada

#### Scenario: Formulario sin temporadas
- **WHEN** el usuario autenticado abre `/nueva-partida` y no hay temporadas
- **THEN** el formulario no muestra el selector de temporada y el body de `POST /api/games` no incluye `seasonId`

#### Scenario: Validación client-side
- **WHEN** el usuario envía con una fila de nombre vacío o un puntaje negativo o no numérico
- **THEN** la UI muestra el error sin llamar a la API

#### Scenario: Error de la API al registrar
- **WHEN** la API responde 400 al enviar
- **THEN** la UI muestra el mensaje de error devuelto por la API
