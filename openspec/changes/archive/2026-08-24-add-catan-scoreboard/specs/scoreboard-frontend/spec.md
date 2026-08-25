# Spec: scoreboard-frontend

## ADDED Requirements

### Requirement: Mostrar ranking de jugadores
El frontend React SHALL consultar `GET /api/scoreboard` al cargar y mostrar el listado de jugadores con su puntaje total, partidos jugados y victorias, en el orden que devuelve la API (puntaje total descendente).

#### Scenario: Carga inicial con datos
- **WHEN** la app se carga y la API devuelve 3 jugadores
- **THEN** la UI muestra los 3 jugadores con `totalPoints`, `gamesPlayed` y `wins`, en el mismo orden que la API

#### Scenario: Sin partidas registradas
- **WHEN** la API devuelve un scoreboard vacío
- **THEN** la UI muestra un mensaje indicando que aún no hay partidas registradas

#### Scenario: Fallo de conexión a la API
- **WHEN** la API no responde o devuelve un error HTTP
- **THEN** la UI muestra un mensaje de error legible en lugar de quedar en blanco o crashear

### Requirement: Mostrar historial de partidas
El frontend SHALL consultar `GET /api/games` y mostrar el historial de partidas con la fecha y el puntaje de cada jugador en cada partida.

#### Scenario: Historial con varias partidas
- **WHEN** la API devuelve 2 partidas
- **THEN** la UI muestra ambas con su fecha y la lista de jugadores con sus puntos

### Requirement: Registrar nueva partida desde la UI
El frontend SHALL mostrar un formulario para registrar una nueva partida: fecha (opcional) y una lista dinámica de filas jugador/puntaje (agregar y quitar filas). Al enviar, SHALL llamar a `POST /api/games` y, en éxito, refrescar el scoreboard y el historial.

#### Scenario: Registro exitoso
- **WHEN** el usuario agrega 2 filas (nombre + puntaje), las completa y envía
- **THEN** la UI muestra confirmación de éxito, el scoreboard y el historial se actualizan con la nueva partida y el formulario se limpia

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
