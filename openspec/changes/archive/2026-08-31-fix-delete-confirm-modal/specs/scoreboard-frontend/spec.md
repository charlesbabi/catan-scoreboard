## MODIFIED Requirements

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
