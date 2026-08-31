# Delta: scoreboard-api

## ADDED Requirements

### Requirement: Eliminar partida
El sistema SHALL exponer `DELETE /api/games/:id` que exige la clave de admin en el header `X-Admin-Key`. Si el header falta o no es la clave vigente, el sistema SHALL responder 401 con `{ "error": "<mensaje>" }` sin eliminar nada. Con clave válida, si `:id` no es un entero positivo o no corresponde a una partida registrada, el sistema SHALL responder 404 con `{ "error": "<mensaje>" }`. Si la clave es válida y la partida existe, el sistema SHALL eliminarla (con persistencia) y responder 200 con `{ "ok": true }`.

#### Scenario: Eliminación válida con clave
- **WHEN** existe la partida id 2 y se envía `DELETE /api/games/2` con `X-Admin-Key` correcto
- **THEN** el sistema responde 200 con `{ "ok": true }`
- **AND** la partida ya no aparece en `GET /api/games` ni en el scoreboard

#### Scenario: Sin clave
- **WHEN** se envía `DELETE /api/games/1` sin el header `X-Admin-Key`
- **THEN** el sistema responde 401 con un `{ "error" }` y la partida no se elimina

#### Scenario: Clave inválida tiene precedencia sobre id inexistente
- **WHEN** se envía `DELETE /api/games/999` con `X-Admin-Key` incorrecto
- **THEN** el sistema responde 401 (no 404) y no se elimina ninguna partida

#### Scenario: Partida inexistente
- **WHEN** se envía `DELETE /api/games/999` con clave válida y no existe la partida id 999
- **THEN** el sistema responde 404 con un `{ "error" }` y no se elimina ninguna partida

#### Scenario: Id no numérico
- **WHEN** se envía `DELETE /api/games/abc` con clave válida
- **THEN** el sistema responde 404

## MODIFIED Requirements

### Requirement: Acceso sin autenticación y CORS
El sistema SHALL responder a los endpoints de lectura (`GET /api/scoreboard`, `GET /api/games`, `GET /api/seasons`) y a `POST /api/admin/verify` sin exigir credenciales previas, y SHALL incluir los headers CORS `Access-Control-Allow-Origin: *` y `Access-Control-Allow-Methods` incluyendo GET/POST/DELETE en las respuestas. La verificación de la clave de admin (`X-Admin-Key`) SHALL requerirse en `POST /api/games`, en `DELETE /api/games/:id`, en `POST /api/seasons` y como `currentKey` en `POST /api/admin/key`. El pre-flight CORS SHALL permitir además el header `X-Admin-Key` en `Access-Control-Allow-Headers`.

#### Scenario: Llamada de lectura sin credenciales
- **WHEN** se realiza `GET /api/scoreboard` sin headers de autenticación
- **THEN** el sistema responde 200 normalmente

#### Scenario: Listado de temporadas sin credenciales
- **WHEN** se realiza `GET /api/seasons` sin headers de autenticación
- **THEN** el sistema responde 200 con la lista de temporadas

#### Scenario: Pre-flight CORS con header de clave
- **WHEN** se envía una request `OPTIONS` a `POST /api/games` con `Access-Control-Request-Headers: X-Admin-Key`
- **THEN** el sistema responde con headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods` incluyendo GET/POST/DELETE y `Access-Control-Allow-Headers` incluyendo `Content-Type` y `X-Admin-Key`

#### Scenario: Pre-flight CORS para DELETE
- **WHEN** se envía una request `OPTIONS` a `DELETE /api/games/1` con `Access-Control-Request-Method: DELETE`
- **THEN** el sistema responde 204 con `Access-Control-Allow-Methods` incluyendo DELETE
