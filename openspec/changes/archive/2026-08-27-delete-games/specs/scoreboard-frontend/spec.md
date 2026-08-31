# Delta: scoreboard-frontend

## ADDED Requirements

### Requirement: Eliminar partidas desde la UI
El historial de la pantalla pública (`/`) SHALL mostrar un botón de eliminar en cada partida solo cuando exista una clave de admin guardada en la sesión del navegador (`sessionStorage`, la misma que usa `/nueva-partida`). Al presionarlo, la UI SHALL llamar a `DELETE /api/games/:id` incluyendo la clave en el header `X-Admin-Key`; en éxito (200) SHALL refrescar el ranking y el historial. Si la API responde 401, la UI SHALL limpiar la clave de la sesión y mostrar un error. Si no hay clave en la sesión, el historial no muestra botones de eliminar.

#### Scenario: Botón visible con clave en sesión
- **WHEN** hay una clave de admin en la sesión y el usuario está en `/`
- **THEN** cada partida del historial muestra un botón de eliminar

#### Scenario: Sin clave no hay botón
- **WHEN** no hay clave de admin en la sesión y el usuario está en `/`
- **THEN** el historial no muestra botones de eliminar

#### Scenario: Eliminación exitosa
- **WHEN** el usuario presiona el botón de eliminar de una partida y la API responde 200
- **THEN** la partida deja de aparecer en el historial y el ranking se actualiza

#### Scenario: Clave invalidada por la API
- **WHEN** el usuario presiona el botón de eliminar y la API responde 401
- **THEN** la UI limpia la clave de la sesión y muestra un error
