# Proposal: add-admin-key-and-polish-scoreboard

## Why

Hoy cualquiera puede registrar partidas: `POST /api/games` no exige nada y el formulario vive en la misma pantalla pública. Necesitamos que cargar partidas sea una acción de administrador (protegida por una clave que el admin puede cambiar) y que el scoreboard se vea más llamativo para mostrarlo en una TV del grupo.

## What Changes

- La pantalla de carga de partidas se mueve a una URL propia (`/nueva-partida`) protegida por una clave de administrador: sin clave, se muestra una pantalla de acceso.
- `POST /api/games` pasa a exigir la clave (header `X-Admin-Key`); sin clave válida → 401.
- Nuevos endpoints de admin: verificar la clave y cambiarla.
- La clave se guarda en el mismo archivo JSON de datos como hash SHA-256 (seed con clave por defecto, compatible con archivos existentes que no la tengan).
- Diseño del ranking más llamativo: podio visual para el top 3, tarjetas y paleta con más presencia (CSS propio, sin librerías).
- Desarrollo TDD: tests en rojo antes de cada implementación (backend `node:test`, frontend `vitest`).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-api`: registrar partida pasa a exigir la clave de admin (401 si falta o es inválida); nuevos endpoints de verificación y cambio de clave; el endpoint de registro queda excluido del acceso sin autenticación y CORS debe permitir el header de clave.
- `scoreboard-storage`: la estructura del archivo JSON incluye el hash de la clave de admin; el seed la crea; archivos existentes sin el campo siguen funcionando (clave por defecto).
- `scoreboard-frontend`: el formulario vive en `/nueva-partida` detrás de una pantalla de clave (con cambio de clave desde la misma pantalla); el ranking gana un diseño llamativo con podio para el top 3.

## Impact

- Backend: `src/storage.js`, `src/server.js`, `src/validate.js` (nuevas validaciones), nuevos tests.
- Frontend: nueva dependencia `react-router-dom`; rutas `/` y `/nueva-partida`; componentes de acceso y cambio de clave; CSS del ranking.
- Docker: sin cambios en compose (nginx ya tiene SPA fallback para deep links).
- Backward compatible: `backend/data/scoreboard.json` creado por el cambio anterior sigue siendo válido.
