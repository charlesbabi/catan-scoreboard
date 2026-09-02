# Propuesta: fix-admin-panel-stale-state

## Why

El panel de administración (`/nueva-partida`) tiene dos bugs de actualización reproducidos en el entorno real:

1. **Operaciones admin con clave nula tras pasar la puerta de clave.** Al ingresar al panel vía la pantalla de clave, la clave se captura en el render de `ProtectedView` (`adminKey={getSessionKey()}`) ANTES de que la clave se guarde en `sessionStorage`; como `ProtectedView` no se re-renderiza al entrar la clave, las secciones llaman a la API con `x-admin-key: null` → 401. Reproductor: `POST /api/games x-admin-key=[null] -> 401` y la pantalla de clave vuelve a aparecer (la eliminación "no elimina"). Tras recargar la página, la clave ya está en sesión al montar y todo funciona — coincide exactamente con el reporte: "si actualizo la página ahí funciona bien".
2. **La lista de partidas del admin no se actualiza al registrar.** `ProtectedView` llama a `useApiData(null)` pero nunca renderiza su estado (estado muerto); `onSaved={refresh}` refresca ese estado muerto. `GamesSection` mantiene su propia copia de la lista que solo se carga al montar y se actualiza al eliminar: una partida registrada aparece recién tras recargar la página.

## What Changes

- Las secciones del panel admin leen la clave de la sesión **en el momento de la petición** (`getSessionKey()` en cada handler) en lugar de usar un prop `adminKey` capturado en render; se elimina el prop `adminKey` de `NewGameForm`, `GamesSection` y `SeasonsSection`.
- La lista de partidas pasa a ser un único estado compartido en `ProtectedView` (el `games` del `useApiData` existente): `GamesSection` recibe `games` por prop y deja de fetchear por su cuenta; tras registrar (`onSaved`) o eliminar (`onDeleted`) se llama al `refresh` compartido, por lo que la lista se actualiza de inmediato sin recargar.
- El comportamiento 401 (limpiar clave y mostrar la pantalla de acceso) se mantiene para claves realmente inválidas; ahora no se dispara por clave nula/desactualizada.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-frontend`:
  - "Registrar nueva partida desde la UI": en éxito, además de scoreboard/historial, la sección "Partidas" del panel admin muestra la nueva partida sin recargar la página.
  - "Pantalla de clave de administrador": todas las operaciones admin (registrar partida, eliminar partida, crear temporada) incluyen en `X-Admin-Key` la clave **actual** de la sesión en el momento de la petición; tras el acceso exitoso por la pantalla de clave, las operaciones admin usan esa clave (sin 401 espurios por clave nula o capturada antes del acceso). Esto también hace que la eliminación funcione en la primera visita al panel (mismo bug: clave nula → 401).

## Impact

- Frontend: `frontend/src/App.jsx` (props de `ProtectedView`), `frontend/src/components/GamesSection.jsx` (estado propio → prop + callback), `frontend/src/components/NewGameForm.jsx`, `frontend/src/components/SeasonsSection.jsx` (lectura de clave en request time), `frontend/src/lib/session.js` (ya exporta `getSessionKey`, sin cambios).
- Sin cambios de API, sin cambios de backend, sin nuevas dependencias.
- Sin migración de datos. Rollback: revertir el commit.
