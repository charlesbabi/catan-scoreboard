# Delta: scoreboard-frontend

## MODIFIED Requirements

### Requirement: Eliminar partidas desde la UI
El panel de administración de la pantalla protegida `/nueva-partida` (tras el acceso con la clave de administrador) SHALL incluir una sección "Partidas" que lista todas las partidas registradas (fecha y puntaje de cada jugador) con un botón de eliminar por partida. Al presionarlo, la UI SHALL llamar a `DELETE /api/games/:id` incluyendo la clave en el header `X-Admin-Key`; en éxito (200) SHALL actualizar la lista de partidas de la sección. Si la API responde 401, la UI SHALL limpiar la clave de la sesión y mostrar la pantalla de acceso, igual que las demás operaciones de admin. La pantalla pública (`/`) no muestra botones de eliminar: su historial es de solo lectura.

#### Scenario: Sección de partidas en el panel de administración
- **WHEN** el admin entra a `/nueva-partida` con la clave y existen partidas registradas
- **THEN** la sección "Partidas" muestra cada partida con su fecha, sus jugadores y un botón de eliminar

#### Scenario: Eliminación exitosa
- **WHEN** el admin presiona el botón de eliminar de una partida y la API responde 200
- **THEN** la partida deja de aparecer en la lista de la sección

#### Scenario: Clave invalidada por la API
- **WHEN** el admin presiona el botón de eliminar y la API responde 401
- **THEN** la UI limpia la clave de la sesión y muestra la pantalla de acceso

#### Scenario: Pantalla pública sin botones de gestión
- **WHEN** cualquier usuario está en `/` (con o sin clave en la sesión)
- **THEN** el historial no muestra botones de eliminar
