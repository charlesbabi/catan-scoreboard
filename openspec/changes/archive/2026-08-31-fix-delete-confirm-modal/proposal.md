## Why

Al presionar "Eliminar" en la sección de partidas del panel de administración, la eliminación se ejecuta de inmediato y cualquier falla de autenticación (401, p. ej. clave desactualizada en otra pestaña) reemplaza todo el panel por la pantalla de clave, dando la impresión de que el sistema "pide la contraseña" como parte de la eliminación. No hay ningún paso de confirmación previo, por lo que un clic accidental borra una partida sin chance de revertir.

## What Changes

- El botón "Eliminar" de cada partida deja de llamar a la API de inmediato: ahora abre un modal de confirmación que muestra los datos de la partida a eliminar (fecha y jugadores).
- El modal ofrece "Cancelar" (cierra sin hacer nada) y "Eliminar" (ejecuta la eliminación).
- Durante la petición, el botón confirmar queda deshabilitado para evitar dobles clics.
- En éxito el modal se cierra, se muestra el mensaje "Partida eliminada" y la lista se actualiza; en error (≠401) se muestra el mensaje de error dentro de la sección.
- Se mantiene el comportamiento existente de 401 (limpiar clave de sesión y mostrar la pantalla de acceso), ya que aplica a todas las operaciones de admin; solo ya no se llega a él como "primer paso" de la eliminación.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-frontend`: el requirement "Eliminar partidas desde la UI" cambia de "presionar el botón llama directamente a la API" a "presionar el botón abre un modal de confirmación; solo al confirmar se llama a la API".

## Impact

- Frontend: `frontend/src/components/GamesSection.jsx` (handler + render del botón), nuevo componente de modal de confirmación y estilos en `frontend/src/index.css`.
- Sin cambios de API: `DELETE /api/games/:id` y el check `X-Admin-Key` del backend se mantienen intactos.
- Sin nuevas dependencias.
