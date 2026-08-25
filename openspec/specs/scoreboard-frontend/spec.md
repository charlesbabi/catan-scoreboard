# Spec: scoreboard-frontend

## Purpose

Frontend del scoreboard de Catan: interfaz para ver el ranking de jugadores, el historial de partidas y registrar nuevas partidas, levantable con Docker Compose.

## Requirements

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
El frontend SHALL mostrar el formulario para registrar una nueva partida (fecha opcional y una lista dinámica de filas jugador/puntaje) únicamente en la URL `/nueva-partida`, tras el acceso con la clave de administrador. Al enviar, la UI SHALL llamar a `POST /api/games` incluyendo la clave en el header `X-Admin-Key` y, en éxito, refrescar el scoreboard y el historial. La pantalla pública (`/`) no incluirá el formulario de registro; en su lugar enlazará a `/nueva-partida`.

#### Scenario: Registro exitoso
- **WHEN** el usuario autenticado agrega 2 filas (nombre + puntaje), las completa y envía
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
