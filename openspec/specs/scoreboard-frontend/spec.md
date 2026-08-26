# Spec: scoreboard-frontend

## Purpose

Frontend del scoreboard de Catan: interfaz para ver el ranking de jugadores, el historial de partidas y registrar nuevas partidas, levantable con Docker Compose.

## Requirements

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

### Requirement: Levantamiento con Docker Compose
El sistema SHALL incluir un `docker-compose.yml` en la raíz que levanta el backend (puerto 3001) y el frontend (puerto 8080) en una misma red, donde el frontend sirve la UI en el mismo origen y revierte el tráfico de `/api` hacia el servicio backend (reverse proxy), de modo que la UI funciona desde cualquier host, y el directorio de datos del backend se monta como volumen para persistir el JSON entre ejecuciones.

#### Scenario: docker compose up
- **WHEN** se ejecuta `docker compose up --build`
- **THEN** la UI es accesible en el puerto 8080 y muestra el scoreboard servido por el backend en el puerto 3001

#### Scenario: Persistencia de datos
- **WHEN** se registra una partida y luego se reinician los contenedores
- **THEN** la partida sigue presente al recargar la UI

### Requirement: Pantalla de clave de administrador
La URL `/nueva-partida` SHALL mostrar primero una pantalla de acceso con un campo de clave cuando no hay clave guardada en la sesión del navegador. Al enviar, la UI SHALL llamar a `POST /api/admin/verify`; si responde 200, la UI guarda la clave en `sessionStorage` y muestra el formulario de nueva partida; si responde 401, la UI muestra un mensaje de error y mantiene la pantalla de acceso.

#### Scenario: Acceso con clave correcta
- **WHEN** el usuario entra en `/nueva-partida` sin clave en sesión y envía la clave correcta
- **THEN** la UI muestra el formulario de nueva partida y no vuelve a pedir clave mientras la sesión tenga la clave guardada

#### Scenario: Acceso con clave incorrecta
- **WHEN** el usuario envía una clave incorrecta
- **THEN** la UI muestra un mensaje de error y sigue mostrando la pantalla de acceso

#### Scenario: Clave en sesión
- **WHEN** el usuario entra en `/nueva-partida` con una clave ya guardada en `sessionStorage`
- **THEN** la UI muestra directamente el formulario de nueva partida, sin pantalla de clave

#### Scenario: Clave invalidada por la API
- **WHEN** el usuario envía una partida y la API responde 401 (clave cambiada o incorrecta)
- **THEN** la UI limpia la clave de la sesión, muestra la pantalla de acceso y muestra el error

### Requirement: Cambio de clave desde la UI
La pantalla protegida de `/nueva-partida` SHALL incluir una sección para cambiar la clave, con campos de clave actual y clave nueva. Al enviar, la UI SHALL llamar a `POST /api/admin/key`; en éxito (200) la UI actualiza la clave guardada en `sessionStorage` y muestra confirmación; en 401 muestra que la clave actual es incorrecta; en 400 muestra el mensaje de error de la API. Antes de enviar, la UI SHALL validar client-side que la clave nueva tenga al menos 4 caracteres.

#### Scenario: Cambio exitoso
- **WHEN** el admin envía la clave actual correcta y una clave nueva de ≥ 4 caracteres
- **THEN** la UI muestra confirmación y las siguientes operaciones de registro usan la nueva clave

#### Scenario: Clave actual incorrecta
- **WHEN** el admin envía una clave actual incorrecta
- **THEN** la UI muestra un error de clave actual incorrecta

#### Scenario: Clave nueva demasiado corta
- **WHEN** el admin envía una clave nueva de menos de 4 caracteres
- **THEN** la UI muestra el error de validación sin llamar a la API

### Requirement: Diseño llamativo del ranking
El ranking SHALL presentarse de forma llamativa: las 3 primeras posiciones (podio) se distinguen visualmente del resto (estilo de tarjeta con acento dorado/plata/bronce e indicador de posición 1º, 2º, 3º), y el listado completo usa un diseño de tarjetas con jerarquía visual clara (nombres y puntajes prominentes). El orden de los datos no cambia respecto al que devuelve la API.

#### Scenario: Podio visible con ≥ 3 jugadores
- **WHEN** la API devuelve 4 o más jugadores en el ranking
- **THEN** la UI muestra las primeras 3 posiciones con el estilo de podio (oro, plata, bronce) y las restantes en el listado

#### Scenario: Menos de 3 jugadores
- **WHEN** la API devuelve 1 o 2 jugadores
- **THEN** la UI muestra cada uno con su estilo de podio (oro para 1º, plata para 2º) sin posiciones faltantes

### Requirement: Crear y listar temporadas desde la UI
La pantalla protegida `/nueva-partida` (tras el acceso con la clave de administrador) SHALL incluir una sección de temporadas con un formulario de creación (un solo campo: nombre) y la lista de las temporadas existentes. La UI SHALL cargar las temporadas con `GET /api/seasons` al mostrar la sección y actualizarlas tras cada creación exitosa. Al enviar, la UI SHALL llamar a `POST /api/seasons` incluyendo la clave en el header `X-Admin-Key`. Antes de enviar, la UI SHALL validar client-side que el nombre no esté vacío (sin llamar a la API si lo está). En éxito la UI muestra confirmación, limpia el campo y refresca la lista; en 400 muestra el mensaje de error devuelto por la API; en 401 la UI limpia la clave de la sesión y muestra la pantalla de acceso, igual que las demás operaciones de admin. La pantalla pública (`/`) no incluye esta sección.

#### Scenario: Creación exitosa
- **WHEN** el admin escribe un nombre y envía el formulario
- **THEN** la UI muestra confirmación de éxito, limpia el campo y la lista incluye la nueva temporada

#### Scenario: Nombre vacío
- **WHEN** el admin envía el formulario con el nombre vacío
- **THEN** la UI muestra el error de validación sin llamar a la API

#### Scenario: Error de la API al crear
- **WHEN** la API responde 400 al enviar
- **THEN** la UI muestra el mensaje de error devuelto por la API

#### Scenario: Clave invalidada por la API
- **WHEN** el admin crea una temporada y la API responde 401 (clave cambiada o incorrecta)
- **THEN** la UI limpia la clave de la sesión y muestra la pantalla de acceso
