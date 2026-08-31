# Proposal: move-deletion-to-admin-panel

## Why

Las acciones de gestión (hoy: eliminar partidas) viven en la pantalla pública, que cualquier visitante ve: el botón de eliminar aparece ahí cuando hay clave en sesión, y el historial público debería ser estrictamente de solo lectura. El administrador debe gestionar las partidas desde el panel de administración, y lo público se consulta sin posibilidad de editar.

## What Changes

- El historial de la pantalla pública (`/`) vuelve a ser de solo lectura: sin botón de eliminar (se revierte ese fragmento del cambio `delete-games`).
- El panel de administración (`/nueva-partida`, tras el acceso con clave) gana una sección "Partidas" que lista todas las partidas registradas con un botón de eliminar por partida; al borrar, refresca la lista.
- Misma semántica de 401 que el resto de las secciones admin: limpia la clave de la sesión y muestra la pantalla de acceso.
- Solo frontend; el endpoint `DELETE /api/games/:id` ya existe y no cambia.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-frontend`: el requirement "Eliminar partidas desde la UI" pasa de la pantalla pública al panel de administración; la pantalla pública queda sin botones de gestión.

## Impact

- Frontend: `src/App.jsx` (revertir wiring de borrado público, montar nueva sección), nuevo componente `src/components/GamesSection.jsx`, `src/index.css` (estilos mínimos si faltan).
- Backend, API y storage: sin cambios.
