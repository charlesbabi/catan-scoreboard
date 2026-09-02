# Design: fix-admin-panel-stale-state

## Context

El panel de administración vive en `ProtectedView` (`frontend/src/App.jsx`), que renderiza dentro de `KeyGate`: `NewGameForm`, `GamesSection`, `SeasonsSection` y `ChangeKeySection`. Hoy el estado está fragmentado:

- `ProtectedView` llama a `useApiData(null)` (scoreboard + games) pero **nunca renderiza** ese estado: es estado muerto que solo se actualiza vía `onSaved={refresh}` de `NewGameForm`.
- `GamesSection` mantiene **su propia** lista (`useState` + fetch al montar + refresh propio tras eliminar).
- La clave se pasa como prop `adminKey={getSessionKey()}`: el valor se evalúa **en el render de `ProtectedView`** y queda horneado en los elementos hijos. Al ingresar por `KeyGate`, `ProtectedView` no se re-renderiza (la clave se guarda en `sessionStorage` y el state que cambia es de `KeyGate`), así que las secciones montan con la clave que existía ANTES del acceso (típicamente `null`).

Bugs reproducidos en el entorno real (backend en Docker + bundle desplegado):

1. `POST /api/games x-admin-key=[null] -> 401` tras pasar la puerta de clave → la pantalla de clave vuelve a aparecer. La eliminación falla igual: "no elimina hasta recargar". Tras una recarga, la clave ya está en sesión al montar y todo funciona.
2. `NewGameForm` → `onSaved` refresca el estado muerto de `ProtectedView`; la lista de `GamesSection` no se toca → la partida registrada no aparece hasta recargar.

El backend (DELETE/POST/GET, checks de clave) quedó verificado y funciona; no se toca.

## Goals / Non-Goals

**Goals:**
- Toda operación admin envía la clave vigente de la sesión en el momento de la petición (sin 401 espurios tras el acceso por la puerta de clave, ni tras un cambio de clave).
- La lista "Partidas" del panel se actualiza de inmediato tras registrar y tras eliminar, sin recargar.
- Diferencial mínimo: solo frontend, sin nueva abstracción de state.

**Non-Goals:**
- No se toca el backend ni la API.
- No se agrega polling, websockets ni state manager.
- No se resuelve la staleness del selector de temporadas de `NewGameForm` (mount-only) — ver Open Questions.

## Decisions

### 1. La clave se lee en el momento de la petición, no como prop

En cada handler admin — `NewGameForm.handleSubmit` (`postGame`), `GamesSection.handleDelete` (`deleteGame`), `SeasonsSection.handleSubmit` (`postSeason`) — se llama `getSessionKey()` (`frontend/src/lib/session.js`, ya exportada y sin dependencias) justo al armar la petición. El prop `adminKey` se elimina de los tres componentes y de `ProtectedView`.

- Alternativa: pasar `getAdminKey={() => getSessionKey()}` como prop. Descartada: indirection innecesaria; el import directo es una línea menos y la fuente de verdad es la misma.
- Alternativa: hacer re-renderizar a `ProtectedView` al entrar la clave (p. ej. estado de "autenticado" en el padre). Descartada: parchea solo este camino; leer en request-time también cubre el caso "cambió la clave con `ChangeKeySection` y `ProtectedView` no se re-renderizó" (prop quedaría con la clave vieja → 401 en la siguiente operación).
- El flujo 401 real (`onKeyInvalid` → limpiar sesión + pantalla de acceso) no cambia.

### 2. Un solo estado de partidas: el del `useApiData` existente de `ProtectedView`

`ProtectedView` ya consume `useApiData(null)`; se deja de ignorar:

- `GamesSection` deja de tener estado/ fetch propios (`games`, `refresh`, `useEffect` de mount) y pasa a ser presentacional: props `{ games, onKeyInvalid, onDeleted }`. Mantiene su estado local de UI (`status`, `pendingGame`, `deleting`) y el flujo del modal; al confirmar y obtener 200 llama `onDeleted()` en lugar de su refresh.
- `ProtectedView` pasa `games={games}` y `onDeleted={refresh}`; `NewGameForm` ya usa `onSaved={refresh}` y ahora ese refresh sí alimenta la lista visible.
- El dato es el mismo de hoy: `fetchGames(null)` = `GET /api/games` sin parámetro (mismo endpoint que usaba `GamesSection`).
- `GamesSection` conserva el render de `games === null` como "Cargando…" (el fetch inicial lo hace el hook del padre).

Alternativa: subir TODA la data (también seasons) al padre. Descartada: los seasons de `NewGameForm` (`useSeasons`) no están reportados como bug y el diff crece; se puede extender el mismo patrón después si hace falta.

## Risks / Trade-offs

- [El refresh post-mutación es un fetch extra (2 round-trips por operación)] → Aceptado: red LAN, mismo patrón que usaba `GamesSection` hoy.
- [Si el refresh compartido falla (red), la lista visible queda stale] → Igual que hoy (el refresh propio de `GamesSection` hacía lo mismo: `catch → []`); el hook muestra el estado previo.
- [`useApiData` se usa con `null` (sin filtro de temporada) en el admin, igual que antes] → Sin cambio de comportamiento; el admin gestiona "todas las partidas" de la temporada más reciente, como hoy.
- [Eliminar el prop `adminKey` toca 4 archivos] → Diferencial chico y mecánico; `oxlint` + tests + repro headless lo cubren.

## Migration Plan

1. Frontend-only: `docker compose up --build` (o despliegue actual). Sin migración de datos, sin cambios de API.
2. Verificación: repro headless (Chrome CDP) — entrar por la puerta de clave → registrar (aparece en "Partidas" sin recargar) → eliminar (desaparece sin recargar) → `npm run lint` + `npm test` (frontend) y `npm test` (backend).
3. Rollback: revertir el commit; el comportamiento vuelve a ser el actual.

## Open Questions

- El selector de temporadas de `NewGameForm` (`useSeasons`, mount-only) no refleja temporadas creadas en `SeasonsSection` hasta recargar. Misma familia de bugs, no reportada; si el grupo lo nota, se extiende el patrón de `ProtectedView` (subir `useSeasons` al padre y pasarlo por prop).
