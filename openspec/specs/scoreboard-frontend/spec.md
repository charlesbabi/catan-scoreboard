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
El frontend SHALL mostrar el formulario para registrar una nueva partida (fecha opcional, temporada y una lista dinámica de filas jugador/puntaje) únicamente en la URL `/nueva-partida`, tras el acceso con la clave de administrador. Si existen temporadas, el formulario SHALL incluir un selector de temporada cargado con `GET /api/seasons`, con la más reciente seleccionada por defecto. Al enviar, la UI SHALL llamar a `POST /api/games` incluyendo la clave en el header `X-Admin-Key` y el `seasonId` de la temporada seleccionada en el body (omitido si no hay temporadas); en éxito, refrescar el scoreboard, el historial y la lista de partidas del panel de administración, de modo que la nueva partida aparezca en la sección "Partidas" sin recargar la página. La pantalla pública (`/`) no incluirá el formulario de registro; en su lugar enlazará a `/nueva-partida`.

#### Scenario: Registro exitoso
- **WHEN** el usuario autenticado agrega 2 filas (nombre + puntaje), las completa y envía
- **THEN** la UI muestra confirmación de éxito, el scoreboard y el historial se actualizan con la nueva partida y el formulario se limpia

#### Scenario: Registro visible en el panel sin recargar
- **WHEN** el usuario autenticado registra una partida y el envío es exitoso
- **THEN** la sección "Partidas" del panel muestra la nueva partida de inmediato, sin necesidad de recargar la página

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
El sistema SHALL incluir un `docker-compose.yml` en la raíz que levanta el backend (puerto 3001) y el frontend (puerto 8090) en una misma red, donde el frontend sirve la UI en el mismo origen y revierte el tráfico de `/api` hacia el servicio backend (reverse proxy), de modo que la UI funciona desde cualquier host. Los datos del backend SHALL persistir en un volumen named de Docker montado en el directorio de datos, independiente del directorio del repositorio, de modo que el JSON persista entre ejecuciones de los contenedores y entre redesplegues del código (rebuild de la imagen o reemplazo del repositorio con un clone nuevo). El archivo de datos no se incluye en el repositorio: se genera al primer arranque con el seed de ejemplo.

#### Scenario: docker compose up
- **WHEN** se ejecuta `docker compose up --build`
- **THEN** la UI es accesible en el puerto 8090 y muestra el scoreboard servido por el backend en el puerto 3001

#### Scenario: Persistencia de datos
- **WHEN** se registra una partida y luego se reinician los contenedores
- **THEN** la partida sigue presente al recargar la UI

#### Scenario: Redeploy no pierde datos
- **WHEN** el código se redespliega en el servidor (rebuild de la imagen o reemplazo del repositorio con un clone nuevo) y se levantan los contenedores
- **THEN** las partidas y temporadas registradas previamente siguen presentes en la UI

### Requirement: Pantalla de clave de administrador
La URL `/nueva-partida` SHALL mostrar primero una pantalla de acceso con un campo de clave cuando no hay clave guardada en la sesión del navegador. Al enviar, la UI SHALL llamar a `POST /api/admin/verify`; si responde 200, la UI guarda la clave en `sessionStorage` y muestra el formulario de nueva partida; si responde 401, la UI muestra un mensaje de error y mantiene la pantalla de acceso. Todas las operaciones de administración (registrar partida, eliminar partida, crear temporada) SHALL incluir en el header `X-Admin-Key` la clave actualmente guardada en la sesión, leída en el momento de realizar la petición; de modo que, tras el acceso exitoso por la pantalla de clave, la primera operación admin de la visita use la clave recién verificada y no una clave nula o capturada antes del acceso.

#### Scenario: Acceso con clave correcta
- **WHEN** el usuario entra en `/nueva-partida` sin clave en sesión y envía la clave correcta
- **THEN** la UI muestra el formulario de nueva partida y no vuelve a pedir clave mientras la sesión tenga la clave guardada

#### Scenario: Acceso con clave incorrecta
- **WHEN** el usuario envía una clave incorrecta
- **THEN** la UI muestra un mensaje de error y sigue mostrando la pantalla de acceso

#### Scenario: Clave en sesión
- **WHEN** el usuario entra en `/nueva-partida` con una clave ya guardada en `sessionStorage`
- **THEN** la UI muestra directamente el formulario de nueva partida, sin pantalla de clave

#### Scenario: Primera operación admin tras el acceso
- **WHEN** el usuario accede con la clave correcta y, sin recargar la página, registra una partida o confirma una eliminación
- **THEN** la petición incluye `X-Admin-Key` con esa clave y la API no responde 401 por clave inválida

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

### Requirement: Diseño orientado a móviles y título descriptivo
El título del documento (`<title>` de `frontend/index.html`) SHALL ser descriptivo de la aplicación ("Catan Scoreboard") y SHALL no ser un nombre genérico de desarrollo. La UI SHALL estar orientada a pantallas de celular: en anchos pequeños (≤ 640 px) el ranking (podio y tabla del resto) SHALL mostrarse completo sin desborde horizontal de la ventana, y el contenido de la página SHALL mantener un margen horizontal mínimo respecto a los bordes de la pantalla.

#### Scenario: Título descriptivo
- **WHEN** el usuario carga cualquier ruta de la app
- **THEN** la pestaña del navegador muestra un título descriptivo de la app y no el nombre "frontend"

#### Scenario: Ranking sin desborde en celular
- **WHEN** la app se ve en una pantalla de 390 px de ancho y el ranking tiene 5 o más jugadores
- **THEN** el podio y la tabla del resto se muestran completos, sin scroll horizontal de la ventana

#### Scenario: Margen en los bordes de la pantalla
- **WHEN** la app se ve en una pantalla de celular (≤ 640 px de ancho)
- **THEN** el contenido mantiene un margen horizontal visible respecto a los bordes izquierdo y derecho de la pantalla

### Requirement: Eliminar partidas desde la UI
El panel de administración de la pantalla protegida `/nueva-partida` (tras el acceso con la clave de administrador) SHALL incluir una sección "Partidas" que lista todas las partidas registradas (fecha y puntaje de cada jugador) con un botón de eliminar por partida. Al presionar el botón, la UI SHALL abrir un modal de confirmación que identifique la partida a eliminar (fecha y jugadores); la UI SHALL no llamar a la API hasta que el usuario confirme. Al confirmar, la UI SHALL llamar a `DELETE /api/games/:id` incluyendo la clave en el header `X-Admin-Key`; en éxito (200) SHALL cerrar el modal, mostrar un mensaje de éxito y actualizar la lista de partidas de la sección. Al cancelar, el modal SHALL cerrarse sin llamar a la API y la lista SHALL quedar sin cambios. Si la API responde 401 tras confirmar, la UI SHALL limpiar la clave de la sesión y mostrar la pantalla de acceso, igual que las demás operaciones de admin. La pantalla pública (`/`) no muestra botones de eliminar: su historial es de solo lectura.

#### Scenario: Sección de partidas en el panel de administración
- **WHEN** el admin entra a `/nueva-partida` con la clave y existen partidas registradas
- **THEN** la sección "Partidas" muestra cada partida con su fecha, sus jugadores y un botón de eliminar

#### Scenario: Confirmación antes de eliminar
- **WHEN** el admin presiona el botón de eliminar de una partida
- **THEN** se muestra un modal de confirmación con la fecha y los jugadores de esa partida y opciones de cancelar y confirmar, y aún no se ha enviado ninguna petición a la API

#### Scenario: Cancelar la eliminación
- **WHEN** el admin cancela en el modal de confirmación
- **THEN** el modal se cierra sin llamar a la API y la partida sigue apareciendo en la lista

#### Scenario: Eliminación exitosa
- **WHEN** el admin confirma la eliminación en el modal y la API responde 200
- **THEN** el modal se cierra, se muestra un mensaje de éxito y la partida deja de aparecer en la lista de la sección

#### Scenario: Clave invalidada por la API
- **WHEN** el admin confirma la eliminación y la API responde 401
- **THEN** la UI limpia la clave de la sesión y muestra la pantalla de acceso

#### Scenario: Pantalla pública sin botones de gestión
- **WHEN** cualquier usuario está en `/` (con o sin clave en la sesión)
- **THEN** el historial no muestra botones de eliminar
