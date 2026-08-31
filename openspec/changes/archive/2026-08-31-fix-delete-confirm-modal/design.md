## Context

La sección "Partidas" del panel de administración (`frontend/src/components/GamesSection.jsx`) llama a `DELETE /api/games/:id` directamente al presionar "Eliminar", sin paso de confirmación. Si la API responde 401 (clave de sesión desactualizada, p. ej. la clave se cambió en otra pestaña), `onKeyInvalid()` limpia la clave de sesión y `KeyGate` reemplaza todo el panel por la pantalla de clave: el usuario percibe que "eliminar lo manda a pedir la contraseña". No existe ningún componente de modal en la app; los bloques de estilo reutilizables son `.card`, `button.primary`, `.ok`/`.error` (`frontend/src/index.css`). El frontend es React 19 + Vite, sin librerías de UI ni de state management; el patrón del código es un componente por archivo en `frontend/src/components/`.

## Goals / Non-Goals

**Goals:**
- Ninguna eliminación se ejecuta sin confirmación explícita del usuario.
- El flujo queda: presionar "Eliminar" → modal con los datos de la partida → confirmar → llamada a la API.
- La UI sigue siendo mobile-first y sin dependencias nuevas.

**Non-Goals:**
- No se cambia el comportamiento de 401 → limpiar clave y mostrar la pantalla de acceso: está especificado para todas las operaciones de admin y solo ocurre con clave realmente inválida.
- No se agrega undo/deshacer ni eliminación en lote.
- No se toca el backend ni la API.

## Decisions

1. **Componente `ConfirmModal.jsx` nuevo (presentacional, controlado).**
   Props: `{ game, deleting, onConfirm, onCancel }`. Renderiza overlay + tarjeta con fecha, chips de jugadores (mismo markup de `.chip` que la lista) y botones "Cancelar" / "Eliminar". El estado (`pendingGame`, `deleting`) vive en `GamesSection`, que ya concentra la lógica de la sección.
   - Alternativa: JSX inline en `GamesSection` (un archivo menos). Descartada: el código del repo separa cada bloque de UI en su propio componente, y el overlay es una unidad con su propio CSS y manejo de teclado.
   - Alternativa: librería de UI/modal. Descartada: añade una dependencia para ~30 líneas.

2. **Cierre seguro por defecto.**
   `autoFocus` en "Cancelar" (Enter no borra), tecla Escape cierra (handler `onKeyDown` en el overlay), click en el backdrop cancela. `role="dialog"` + `aria-modal="true"`.
   - Alternativa: focus trap completo. Descartada: el modal es transitorio y el único otro foco es el backdrop; un trap completo es sobra para esta escala.

3. **Protección contra dobles clic.**
   Mientras la petición está en vuelo (`deleting`), "Eliminar" queda deshabilitado y muestra "Eliminando…".

4. **Resolución de la petición.**
   - 200 → cerrar modal, `setStatus` ok, `refresh()` (igual que hoy).
   - 401 → `onKeyInvalid()` (sin cambios; el modal se vuelve irrelevante porque `KeyGate` desmonta `GamesSection`).
   - Otro error → cerrar modal y mostrar el mensaje de error en el estado de la sección (mismo tratamiento que hoy).

5. **CSS mínimo en `index.css`.**
   `.modal-overlay` (posición fija, fondo semitransparente, centrado con flex, `max-width` tipo `.keygate` para escritorio) reutilizando `.card` para la caja del modal. Sin CSS nuevo para los botones: se usan `button.primary` y `.game-delete` existentes.

## Risks / Trade-offs

- [El usuario confirma con Enter desde el campo de cancelación] → `autoFocus` en "Cancelar" hace que Enter cancele, no elimine; es el comportamiento más seguro.
- [Sin focus trap, un teclado puede recorrer controles tras el modal] → aceptado: el overlay cubre la pantalla y el modal se cierra con Escape; no hay datos sensibles ni flujos largos.
- [401 tras confirmar sigue mandando a la pantalla de clave] → es el comportamiento especificado para admin; la confirmación ya no evita ese caso, pero ese caso es "clave inválida", no "eliminar sin confirmación".

## Migration Plan

Cambio solo frontend, sin migración de datos ni cambios de API. Despliegue normal del frontend (docker compose). Rollback: revertir el commit; el comportamiento vuelve a ser "eliminar directo sin modal".
