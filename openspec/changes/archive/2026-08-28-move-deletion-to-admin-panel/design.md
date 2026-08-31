# Design: move-deletion-to-admin-panel

## Context

Tras `delete-games`, el botón de eliminar vive en el historial público (visible cuando hay clave en sesión). El requisito de producto: todas las acciones de gestión viven en el panel de administración (`/nueva-partida`, detrás de `KeyGate`); la pantalla pública es de solo lectura. El panel ya tiene el patrón por secciones (`NewGameForm`, `SeasonsSection`, `ChangeKeySection`): props `adminKey` + `onKeyInvalid`, `refresh` local, y en 401 → `onKeyInvalid()` (limpia la sesión y re-monta la puerta de clave). El endpoint `DELETE /api/games/:id` ya existe y no cambia.

## Goals / Non-Goals

**Goals:**
- Borrado de partidas solo desde el panel de administración.
- Historial público estrictamente de solo lectura.

**Non-Goals:**
- Sin edición de partidas, sin borrado masivo, sin filtros por temporada en la sección.
- Sin cambios de backend/API.

## Decisions

1. **Nuevo componente `GamesSection.jsx`** replicando el patrón de `SeasonsSection`: lista local de partidas con `fetchGames()` (sin parámetro de temporada: la gestión ve todo), botón de eliminar por partida, `refresh` en éxito, `onKeyInvalid()` en 401.
2. **`PublicView` vuelve a solo lectura**: se retira `adminKey`, `deleteError`, `handleDelete` y las props de `History`; el componente `History` vuelve a `({ games })` sin botón. `deleteGame` deja de importarse en `App.jsx` (queda en `lib/api.js` para `GamesSection`).
3. **`ProtectedView`** monta `<GamesSection adminKey={getSessionKey()} onKeyInvalid={handleKeyInvalid} />` junto a las demás secciones.
4. **Visual**: la lista reutiliza el patrón del historial público (fecha + chips de jugadores) y el botón `.game-delete` existente.
   - Alternativa descartada: mantener el botón público oculto/condicional — el requisito es que la gestión no exista en lo público.
5. **Sin filtro de temporada en la sección**: la gestión necesita ver todas las partidas; la vista por temporada ya existe en la pantalla pública.

## Risks / Trade-offs

- [Borrar desde el panel no actualiza la vista pública en vivo] → al volver a `/`, `useApiData` re-fetch en mount; consistente.
- [Lista larga de partidas] → app privada (decenas de partidas); si crece, paginación.

## Migration Plan

Sin datos. Rollback: revertir el commit.

## Open Questions

(ninguna)
