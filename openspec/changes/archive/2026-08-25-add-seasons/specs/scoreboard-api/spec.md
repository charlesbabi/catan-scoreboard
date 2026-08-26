# Spec: scoreboard-api

## ADDED Requirements

### Requirement: Crear temporada
El sistema SHALL exponer `POST /api/seasons` que acepta un JSON body `{ "name": "<texto>" }` junto con el header `X-Admin-Key` conteniendo la clave de admin. Si el header falta o no es la clave vigente, el sistema SHALL responder 401 con `{ "error": "<mensaje>" }` sin procesar el body, incluso si el body también es inválido. Con clave válida y body válido, el sistema persiste la temporada con un `id` auto-incremental y el `name` recortado (trim) y devuelve 201 con la temporada creada.

#### Scenario: Creación válida con clave
- **WHEN** se envía `POST /api/seasons` con header `X-Admin-Key` correcto y body `{ "name": "Temporada 2026-1" }`
- **THEN** el sistema responde 201 con la temporada creada, incluyendo `id` y `name`
- **AND** la temporada aparece en `GET /api/seasons`

#### Scenario: Sin clave
- **WHEN** se envía `POST /api/seasons` sin el header `X-Admin-Key`
- **THEN** el sistema responde 401 con un `{ "error" }` y no se registra ninguna temporada

#### Scenario: Clave inválida tiene precedencia sobre body inválido
- **WHEN** se envía `POST /api/seasons` con `X-Admin-Key` incorrecto y un body inválido (por ejemplo sin `name`)
- **THEN** el sistema responde 401 (no 400)

### Requirement: Listar temporadas
El sistema SHALL exponer `GET /api/seasons` sin autenticación, que devuelve todas las temporadas creadas en orden de creación (ascendente por `id`). Cada temporada SHALL contener `id` (number) y `name` (string).

#### Scenario: Temporadas en orden de creación
- **WHEN** se crearon las temporadas con id 1 y 2
- **THEN** `GET /api/seasons` las devuelve en el orden 1, 2

#### Scenario: Sin temporadas
- **WHEN** no hay temporadas creadas
- **THEN** `GET /api/seasons` responde 200 con una lista vacía

### Requirement: Validación de la creación de temporada
El sistema SHALL rechazar con 400 y body `{ "error": "<mensaje>" }` las creaciones inválidas: `name` ausente, no texto, o vacío tras trim; o body que no sea JSON válido.

#### Scenario: Nombre vacío
- **WHEN** se envía `POST /api/seasons` con clave válida y body `{ "name": "" }` o `{ "name": "   " }` o sin el campo `name`
- **THEN** el sistema responde 400 con un error indicando que el nombre es requerido y no se crea la temporada

#### Scenario: Nombre no texto
- **WHEN** se envía `POST /api/seasons` con clave válida y body `{ "name": 42 }`
- **THEN** el sistema responde 400 con un error indicando que el nombre debe ser texto

#### Scenario: Body no JSON
- **WHEN** se envía `POST /api/seasons` con clave válida y un body que no es JSON válido
- **THEN** el sistema responde 400 con un error indicando que el body debe ser JSON

## MODIFIED Requirements

### Requirement: Acceso sin autenticación y CORS
El sistema SHALL responder a los endpoints de lectura (`GET /api/scoreboard`, `GET /api/games`, `GET /api/seasons`) y a `POST /api/admin/verify` sin exigir credenciales previas, y SHALL incluir los headers CORS `Access-Control-Allow-Origin: *` y `Access-Control-Allow-Methods` incluyendo GET/POST en las respuestas. La verificación de la clave de admin (`X-Admin-Key`) SHALL requerirse en `POST /api/games`, en `POST /api/seasons` y como `currentKey` en `POST /api/admin/key`. El pre-flight CORS SHALL permitir además el header `X-Admin-Key` en `Access-Control-Allow-Headers`.

#### Scenario: Llamada de lectura sin credenciales
- **WHEN** se realiza `GET /api/scoreboard` sin headers de autenticación
- **THEN** el sistema responde 200 normalmente

#### Scenario: Listado de temporadas sin credenciales
- **WHEN** se realiza `GET /api/seasons` sin headers de autenticación
- **THEN** el sistema responde 200 con la lista de temporadas

#### Scenario: Pre-flight CORS con header de clave
- **WHEN** se envía una request `OPTIONS` a `POST /api/games` con `Access-Control-Request-Headers: X-Admin-Key`
- **THEN** el sistema responde con headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods` incluyendo GET/POST y `Access-Control-Allow-Headers` incluyendo `Content-Type` y `X-Admin-Key`
