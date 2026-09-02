# Delta: scoreboard-frontend

## MODIFIED Requirements

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
