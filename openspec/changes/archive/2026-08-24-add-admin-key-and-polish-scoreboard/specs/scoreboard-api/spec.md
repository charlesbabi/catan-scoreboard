# Spec: scoreboard-api

## ADDED Requirements

### Requirement: Verificación de la clave de administrador
El sistema SHALL exponer `POST /api/admin/verify` que acepta un JSON body `{ "key": "<texto>" }` y responde 200 con `{ "ok": true }` si la clave coincide con la clave de admin almacenada, o 401 con `{ "error": "<mensaje>" }` si no coincide, falta o no es texto. La comparación SHALL realizarse en tiempo constante (sin early-exit por prefijo).

#### Scenario: Clave correcta
- **WHEN** se envía `POST /api/admin/verify` con la clave almacenada
- **THEN** el sistema responde 200 con `{ "ok": true }`

#### Scenario: Clave incorrecta o ausente
- **WHEN** se envía `POST /api/admin/verify` con una clave distinta, sin el campo `key` o con `key` no texto
- **THEN** el sistema responde 401 con un `{ "error" }` descriptivo

### Requirement: Cambio de la clave de administrador
El sistema SHALL exponer `POST /api/admin/key` que acepta un JSON body `{ "currentKey": "<texto>", "newKey": "<texto>" }` y, si `currentKey` es la clave vigente, persiste el hash de `newKey` como nueva clave de admin respondiendo 200 con `{ "ok": true }`. Si `currentKey` no es la clave vigente, responde 401. Si `newKey` no es texto o tiene menos de 4 caracteres (tras trim), responde 400 con `{ "error" }` sin modificar la clave.

#### Scenario: Cambio exitoso
- **WHEN** se envía `POST /api/admin/key` con la `currentKey` correcta y una `newKey` válida (≥ 4 chars)
- **THEN** el sistema responde 200 y las requests posteriores usan la nueva clave (la anterior deja de ser válida en `POST /api/games` y `POST /api/admin/verify`)

#### Scenario: Clave actual incorrecta
- **WHEN** se envía `POST /api/admin/key` con `currentKey` inválida
- **THEN** el sistema responde 401 y la clave almacenada no se modifica

#### Scenario: Nueva clave inválida
- **WHEN** se envía `POST /api/admin/key` con `currentKey` correcta pero `newKey` vacía, con menos de 4 chars o no texto
- **THEN** el sistema responde 400 con un `{ "error" }` y la clave almacenada no se modifica

## MODIFIED Requirements

### Requirement: Registrar nueva partida
El sistema SHALL exponer `POST /api/games` que acepta un JSON body `{ date?, players: [{ name, points }] }` junto con el header `X-Admin-Key` conteniendo la clave de admin. Si el header falta o no es la clave vigente, el sistema SHALL responder 401 con `{ "error": "<mensaje>" }` sin procesar el body, incluso si el body también es inválido. Con clave válida, el sistema persiste la partida con un `id` auto-incremental y devuelve 201 con la partida creada. `date` es opcional; si no se envía, el sistema SHALL usar la fecha actual (YYYY-MM-DD).

#### Scenario: Registro válido con clave
- **WHEN** se envía `POST /api/games` con header `X-Admin-Key` correcto y body `{ "date": "2026-08-24", "players": [{"name": "Ana", "points": 10}, {"name": "Beto", "points": 5}] }`
- **THEN** el sistema responde 201 con la partida creada, incluyendo `id`, `date` y los players enviados
- **AND** la partida aparece en `GET /api/games` y en el scoreboard

#### Scenario: Sin clave
- **WHEN** se envía `POST /api/games` sin el header `X-Admin-Key`
- **THEN** el sistema responde 401 con un `{ "error" }` y no se registra ninguna partida

#### Scenario: Clave inválida tiene precedencia sobre body inválido
- **WHEN** se envía `POST /api/games` con `X-Admin-Key` incorrecto y un body inválido (por ejemplo `players` vacía)
- **THEN** el sistema responde 401 (no 400)

#### Scenario: Fecha omitida
- **WHEN** se envía `POST /api/games` con clave válida y sin el campo `date`
- **THEN** el sistema responde 201 asignando la fecha actual (YYYY-MM-DD) a la partida

### Requirement: Acceso sin autenticación y CORS
El sistema SHALL responder a los endpoints de lectura (`GET /api/scoreboard`, `GET /api/games`) y a `POST /api/admin/verify` sin exigir credenciales previas, y SHALL incluir los headers CORS `Access-Control-Allow-Origin: *` y `Access-Control-Allow-Methods` incluyendo GET/POST en las respuestas. La verificación de la clave de admin (`X-Admin-Key`) SHALL requerirse solo en `POST /api/games` y como `currentKey` en `POST /api/admin/key`. El pre-flight CORS SHALL permitir además el header `X-Admin-Key` en `Access-Control-Allow-Headers`.

#### Scenario: Llamada de lectura sin credenciales
- **WHEN** se realiza `GET /api/scoreboard` sin headers de autenticación
- **THEN** el sistema responde 200 normalmente

#### Scenario: Pre-flight CORS con header de clave
- **WHEN** se envía una request `OPTIONS` a `POST /api/games` con `Access-Control-Request-Headers: X-Admin-Key`
- **THEN** el sistema responde con headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods` incluyendo GET/POST y `Access-Control-Allow-Headers` incluyendo `Content-Type` y `X-Admin-Key`
