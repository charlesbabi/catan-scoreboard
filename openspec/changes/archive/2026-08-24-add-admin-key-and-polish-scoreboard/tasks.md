# Tasks: add-admin-key-and-polish-scoreboard

TDD: los tests se escriben y corren en rojo antes de cada implementación.

## 1. Setup

- [x] 1.1 Instalar `react-router-dom` en `frontend/`

## 2. Backend: clave de admin en storage (TDD)

- [x] 2.1 Tests en rojo: seed crea `adminKeyHash` (sha256 hex de la clave por defecto `catan`); archivo existente sin `adminKeyHash` → verificación usa la clave por defecto; `setAdminKey(newKey)` persiste el nuevo hash y la lectura lo devuelve
- [x] 2.2 Implementar en `backend/src/storage.js`: `getAdminKeyHash()`, `setAdminKey(key)`, default cuando falta el campo, persistir el hash en cada escritura (tests verdes)

## 3. Backend: endpoints de admin + gate en POST /api/games (TDD)

- [x] 3.1 Tests en rojo: `POST /api/admin/verify` → 200 `{ok:true}` con clave correcta; 401 con clave incorrecta, ausente o no texto
- [x] 3.2 Tests en rojo: `POST /api/admin/key` → 200 y la clave vieja deja de valer; 401 con currentKey inválida; 400 con newKey vacía/<4 chars/no texto (sin modificar la clave)
- [x] 3.3 Tests en rojo: `POST /api/games` sin `X-Admin-Key` → 401; con clave incorrecta → 401; con clave correcta → 201 (actualizar los tests existentes de registro para enviar el header); 401 tiene precedencia sobre 400 de body
- [x] 3.4 Tests en rojo: pre-flight CORS incluye `X-Admin-Key` en `Access-Control-Allow-Headers`
- [x] 3.5 Implementar en `backend/src/server.js`: endpoints de admin, gate del header (comparación con `crypto.timingSafeEqual` sobre sha256), CORS actualizado; todos los tests backend en verde

## 4. Frontend: validación del cambio de clave (TDD)

- [x] 4.1 Tests en rojo (vitest): validación del form de cambio de clave — currentKey requerido, newKey ≥ 4 chars tras trim, newKey no texto → error; valores válidos → null
- [x] 4.2 Implementar la función de validación hasta que los tests pasen

## 5. Frontend: rutas y gate de clave

- [x] 5.1 Rutas con react-router: `/` (público: ranking + historial, sin form) y `/nueva-partida` (protegida)
- [x] 5.2 `KeyGate`: pantalla de clave → `POST /api/admin/verify` → 200 guarda en `sessionStorage` y muestra el form; 401 muestra error y mantiene la pantalla; con clave en sesión muestra el form directo
- [x] 5.3 Sección de cambio de clave en la pantalla protegida: current + new → `POST /api/admin/key`; 200 actualiza `sessionStorage` y confirma; 401/400 muestran el error
- [x] 5.4 El form de partida envía `X-Admin-Key`; si la API responde 401 al registrar, se limpia `sessionStorage` y vuelve la pantalla de clave; enlace a `/nueva-partida` desde la pantalla pública

## 6. Diseño llamativo del ranking

- [x] 6.1 CSS: fondo con gradiente oscuro, tarjetas con elevación, nombres/puntajes prominentes
- [x] 6.2 Podio top 3: tarjetas oro/plata/bronce con indicador 1º/2º/3º (y caso < 3 jugadores), resto en lista

## 7. Verificación final

- [x] 7.1 `npm test` en `backend/` y `frontend/`: todo verde
- [x] 7.2 `docker compose up --build`: `/` público muestra el ranking; `/nueva-partida` pide la clave (por defecto `catan`); registrar con clave funciona y persiste; `curl POST /api/games` sin clave → 401; cambiar la clave desde la UI y registrar con la nueva clave
- [x] 7.3 Backward compat: arrancar el backend con un file de datos sin `adminKeyHash` (DATA_FILE temporal) y verificar que la clave por defecto funciona y la escritura persiste el hash
- [x] 7.4 `openspec validate add-admin-key-and-polish-scoreboard` sin errores
