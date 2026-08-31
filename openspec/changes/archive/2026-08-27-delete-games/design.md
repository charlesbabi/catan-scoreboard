# Design: delete-games

## Context

API REST en `node:http` (`src/server.js`) con patrón de admin ya establecido: `keyMatches(hash, header X-Admin-Key)` primero (401 con precedencia), luego validación (400/404). Storage en archivo JSON (`src/storage.js`) con `addGame`/`addSeason` pero sin eliminación. El frontend guarda la clave de admin en `sessionStorage` (`lib/session.js`), hoy solo usada por `KeyGate` en `/nueva-partida`; la pantalla pública (`/`) muestra el historial sin acciones.

## Goals / Non-Goals

**Goals:**
- Eliminar partidas individuales con clave de admin, disponible donde el usuario ve los datos (historial público).

**Non-Goals:**
- Sin borrado masivo ni "vaciar historial".
- Sin deshacer/soft-delete.
- Sin edición de partidas ni borrado de temporadas (afuera de este cambio).

## Decisions

1. **`DELETE /api/games/:id`** siguiendo el patrón de `POST /api/games`: 401 sin clave/inválida (precedencia sobre 404), 404 si el id no es entero positivo o no existe, 200 `{ "ok": true }` en éxito. Alternativa descartada: 204 — 200+body es consistente con los endpoints admin existentes.
2. **Ruta**: match contra `^/api/games/(\d+)$`; ids no numéricos caen al 404 genérico del final del handler (cumple el escenario "Id no numérico" sin código extra).
3. **Storage `deleteGame(id)`**: lee el doc, busca la partida; si existe la filtra y reescribe, devolviéndola; si no, devuelve `null` sin reescribir el archivo (no hay punto en reescribir lo mismo).
4. **CORS**: `Access-Control-Allow-Methods` pasa a `GET, POST, DELETE, OPTIONS`.
5. **Frontend**: el botón de eliminar vive en el historial de la pantalla pública, visible solo cuando `getSessionKey()` (lectura síncrona de `sessionStorage`) devuelve clave. Extiende el componente `History` actual con `adminKey` y `onDelete(id)`; en éxito llama al `refresh()` ya existente; en 401 hace `clearSessionKey()` + banner de error (mismo patrón que `onKeyInvalid` en `ProtectedView`).
   - Alternativa descartada: sección "Partidas" con borrado dentro de `/nueva-partida` — duplica el historial y obliga a salir de la pantalla pública para limpiar datos.
6. **Botón**: reutiliza el estilo rojo ya existente para eliminar filas (`.row button`), tamaño compacto, por partida.

## Risks / Trade-offs

- [Borrar una partida cambia el ranking que otros estén viendo] → app privada, el `refresh` tras el borrado deja la vista consistente; aceptable.
- [`sessionStorage` es por pestaña: abrir `/` en otra pestaña no muestra el botón] → comportamiento consistente con `KeyGate`; no es un bug.
- [Dos borrados concurrentes de la misma partida] → el segundo recibe 404, la UI muestra el error; sin corrupción de datos.

## Migration Plan

Sin migración de datos (el formato del JSON no cambia). Rollback: revertir el commit; los datos no se ven afectados.

## Open Questions

(ninguna)
