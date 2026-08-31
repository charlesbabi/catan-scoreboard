## 1. Componente ConfirmModal

- [x] 1.1 Crear `frontend/src/components/ConfirmModal.jsx`: componente presentacional con props `{ game, deleting, onConfirm, onCancel }`; overlay con `role="dialog"` y `aria-modal="true"`, caja reutilizando `.card`, muestra fecha y chips de jugadores de la partida, botones "Cancelar" (con `autoFocus`) y "Eliminar"; mientras `deleting` es true, "Eliminar" queda deshabilitado y muestra "Eliminando…"
- [x] 1.2 Cierre del modal: tecla Escape llama a `onCancel` (handler `onKeyDown` en el overlay) y el click en el backdrop (fuera de la caja) llama a `onCancel`
- [x] 1.3 Agregar estilo `.modal-overlay` en `frontend/src/index.css`: posición fija a pantalla completa, fondo semitransparente, centrado con flex, `max-width` comparable a `.keygate` para escritorio; sin estilos nuevos para botones (reutilizar `button.primary` y `.game-delete`)

## 2. Flujo de eliminación en GamesSection

- [x] 2.1 En `frontend/src/components/GamesSection.jsx` agregar estado `pendingGame` (partida a eliminar) y `deleting`; el botón "Eliminar" de cada partida deja de llamar a `handleDelete` directamente y pasa `setPendingGame(g)`
- [x] 2.2 Renderizar `<ConfirmModal>` cuando `pendingGame` no sea null; al confirmar ejecutar la eliminación actual: 200 → cerrar modal, estado ok "Partida eliminada", `refresh()`; 401 → `onKeyInvalid()`; otro error → cerrar modal y estado error con el mensaje
- [x] 2.3 Al cancelar, cerrar el modal sin llamar a la API y dejar la lista sin cambios

## 3. Verificación

- [x] 3.1 Ejecutar `npm run lint` y `npm run build` en `frontend/` sin errores
- [x] 3.2 Verificar en dev: presionar "Eliminar" abre el modal sin enviar petición a la API; cancelar cierra y la partida sigue en la lista; confirmar borra la partida, cierra el modal y muestra el mensaje de éxito; con clave desactualizada, confirmar muestra la pantalla de acceso
