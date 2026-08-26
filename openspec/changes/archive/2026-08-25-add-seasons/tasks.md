# Tasks: add-seasons

TDD: los tests se escriben y corren en rojo antes de cada implementación.

## 1. Backend: temporadas en storage (TDD)

- [x] 1.1 Tests en rojo: archivo existente sin el campo `seasons` → la lista se trata como vacía y no falla la lectura; `addSeason({name})` crea `{ id, name }` con `id` auto-incremental; la escritura persiste `seasons` junto con `games` y `adminKeyHash`
- [x] 1.2 Implementar en `backend/src/storage.js`: campo `seasons` en `readDoc`/`writeDoc` (default `[]`), `getSeasons()`, `addSeason({ name })` (tests verdes)

## 2. Backend: endpoints de temporadas (TDD)

- [x] 2.1 Tests en rojo: `POST /api/seasons` sin `X-Admin-Key` → 401; con clave incorrecta → 401; 401 tiene precedencia sobre 400 de body inválido; con clave correcta y `{ name }` válido → 201 con `{ id, name }` y aparece en el listado
- [x] 2.2 Tests en rojo: `POST /api/seasons` con `name` ausente, vacío/espacios, o no texto → 400; body no JSON → 400; `GET /api/seasons` → 200 en orden de creación (ascendente por `id`) y `[]` sin temporadas
- [x] 2.3 Tests en rojo (storage): crear una temporada no afecta la lectura de partidas ni de `adminKeyHash`
- [x] 2.4 Implementar `validateSeason(payload)` en `backend/src/validate.js` y las rutas `POST /api/seasons` (gate del header antes del body, mismo patrón que `POST /api/games`) y `GET /api/seasons` en `backend/src/server.js`; todos los tests backend en verde

## 3. Frontend: sección de temporadas en `/nueva-partida`

- [x] 3.1 `frontend/src/lib/api.js`: `fetchSeasons()` y `postSeason(key, name)` (header `x-admin-key`)
- [x] 3.2 Sección "Temporadas" en la vista protegida (dentro de `KeyGate`): input de nombre + botón crear; nombre vacío → error client-side sin llamar a la API; al enviar `POST /api/seasons`; en éxito muestra confirmación, limpia el campo y refresca la lista; en 400 muestra el error de la API
- [x] 3.3 Lista de temporadas existentes (cargada con `GET /api/seasons`, con estado de carga y caso vacío); si la API responde 401 al crear, `clearSessionKey()` + re-mostrar la `KeyGate` (reutilizar el patrón `onKeyInvalid` de `ProtectedView`)
- [x] 3.4 CSS mínimo para la sección siguiendo el estilo de tarjetas existente

## 4. Verificación final

- [x] 4.1 `npm test` en `backend/` y `frontend/`: todo verde
- [x] 4.2 `docker compose up --build`: en `/nueva-partida` (clave por defecto `catan`) crear una temporada desde la UI, verla en la lista; `curl GET /api/seasons` sin credenciales → 200; `curl POST /api/seasons` sin clave → 401
- [x] 4.3 Backward compat: arrancar el backend con un file de datos sin `seasons` (DATA_FILE temporal) y verificar que `GET /api/seasons` responde `[]` y la primera creación persiste el campo
- [x] 4.4 `openspec validate add-seasons` sin errores
