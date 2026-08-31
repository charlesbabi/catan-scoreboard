# Spec: scoreboard-storage

## Purpose

Capa de persistencia del scoreboard de Catan: almacenamiento de partidas en un archivo JSON local con seed de datos de ejemplo y robustez ante archivos corruptos o ausentes.

## Requirements

### Requirement: Persistencia en archivo JSON local
El sistema SHALL persistir las partidas y las temporadas en un archivo JSON local (`data/scoreboard.json` dentro del backend, configurable por variable de entorno para fines de test). El archivo SHALL tener la estructura `{ "games": [...], "adminKeyHash": "<hex>", "seasons": [...] }` donde cada juego es `{ id: number, date: string, players: [{ name: string, points: number }], seasonId: number o null }`, `adminKeyHash` es el hash SHA-256 (hex) de la clave de admin vigente y cada temporada es `{ id: number, name: string }`. Si el archivo existe sin el campo `adminKeyHash` (archivo creado por una versión anterior), el sistema SHALL tratarlo como si la clave vigente fuera la clave por defecto y persistir el hash correspondiente en la siguiente escritura. Si el archivo existe sin el campo `seasons`, el sistema SHALL tratarlo como lista de temporadas vacía y persistir el campo en la siguiente escritura. Si un juego no tiene el campo `seasonId` (archivo creado por una versión anterior), el sistema SHALL tratarlo como partida sin temporada (`null`) sin fallar la lectura.

#### Scenario: Lectura de partidas persistidas
- **WHEN** el archivo contiene 2 juegos
- **THEN** la capa de storage devuelve los 2 juegos con sus `id`, `date`, `players` intactos y su `seasonId` (o sin el campo, tratado como sin temporada)

#### Scenario: Escritura de nueva partida
- **WHEN** se registra una nueva partida
- **THEN** el archivo JSON se reescribe incluyendo la nueva partida junto con las existentes, el campo `adminKeyHash` y el campo `seasons`

#### Scenario: Escritura de nueva partida con temporada
- **WHEN** se registra una nueva partida asignada a la temporada id 1
- **THEN** la partida persistida incluye `seasonId: 1` junto con `id`, `date` y `players`

#### Scenario: Archivo antiguo sin adminKeyHash
- **WHEN** el archivo existe con solo `{ "games": [...] }` (sin `adminKeyHash`)
- **THEN** la lectura de partidas funciona normalmente y la verificación de clave usa la clave por defecto
- **AND** la siguiente escritura persiste el archivo con `adminKeyHash` presente

#### Scenario: Archivo sin campo seasons
- **WHEN** el archivo existe sin el campo `seasons`
- **THEN** la lista de temporadas se trata como vacía (no falla la lectura)
- **AND** la siguiente escritura persiste el archivo con `seasons` presente

#### Scenario: Partidas antiguas sin seasonId
- **WHEN** el archivo contiene juegos sin el campo `seasonId`
- **THEN** la lectura funciona normalmente y esas partidas se tratan como sin temporada (`null`)

#### Scenario: Escritura de nueva temporada
- **WHEN** se crea una nueva temporada
- **THEN** el archivo JSON se reescribe incluyendo la nueva temporada junto con las existentes, las partidas y el campo `adminKeyHash`

### Requirement: Seed de datos de ejemplo
Si el archivo de datos no existe, el sistema SHALL crearlo al arrancar con un conjunto de datos de ejemplo: al menos 3 partidas con al menos 3 jugadores distintos y puntajes de Catan típicos (0 a 10, con alguno alcanzando 10), más el campo `adminKeyHash` correspondiente a la clave por defecto. El seed SHALL ejecutarse una sola vez; si el archivo ya existe (aunque esté vacío de juegos) no se reemplaza.

#### Scenario: Primera ejecución sin archivo
- **WHEN** el sistema arranca y `data/scoreboard.json` no existe
- **THEN** el archivo se crea con al menos 3 partidas de ejemplo y el campo `adminKeyHash`
- **AND** `GET /api/scoreboard` devuelve el ranking calculado sobre esos datos

#### Scenario: Archivo existente se respeta
- **WHEN** el sistema arranca y el archivo existe con contenido propio (incluyendo `{ "games": [] }`)
- **THEN** el contenido no se modifica y no se aplican datos de ejemplo

### Requirement: Robustez ante archivo corrupto o ausente en tiempo de ejecución
Si el archivo JSON no existe o contiene JSON inválido al momento de una lectura, el sistema SHALL tratarlo como lista vacía (no SHALL crashear), y la siguiente escritura válida SHALL reescribir el archivo con contenido válido.

#### Scenario: Archivo corrupto
- **WHEN** el archivo contiene texto que no es JSON válido y se ejecuta `GET /api/games`
- **THEN** el sistema responde 200 con una lista vacía en lugar de 500

#### Scenario: Recuperación tras corrupción
- **WHEN** el archivo estaba corrupto y luego se registra una partida válida
- **THEN** el archivo queda con JSON válido conteniendo al menos esa partida

### Requirement: Eliminar partida
La capa de storage SHALL exponer `deleteGame(id)`: si existe una partida con el `id` dado, la elimina de la lista de partidas y reescribe el archivo JSON, devolviendo la partida eliminada; si no existe, SHALL devolver `null` sin modificar el archivo. El resto del documento (`seasons`, `adminKeyHash` y las partidas restantes) SHALL conservarse.

#### Scenario: Eliminación de partida existente
- **WHEN** el archivo contiene 3 partidas y se llama `deleteGame(2)`
- **THEN** devuelve la partida id 2 y el archivo queda con las 2 restantes, junto con `seasons` y `adminKeyHash`

#### Scenario: Eliminación de partida inexistente
- **WHEN** se llama `deleteGame(999)` y no existe ninguna partida con ese id
- **THEN** devuelve `null` y el archivo no se modifica
