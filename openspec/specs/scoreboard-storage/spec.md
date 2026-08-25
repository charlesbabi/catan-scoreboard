# Spec: scoreboard-storage

## Purpose

Capa de persistencia del scoreboard de Catan: almacenamiento de partidas en un archivo JSON local con seed de datos de ejemplo y robustez ante archivos corruptos o ausentes.

## Requirements

### Requirement: Persistencia en archivo JSON local
El sistema SHALL persistir todas las partidas en un archivo JSON local (`data/scoreboard.json` dentro del backend, configurable por variable de entorno para fines de test). El archivo SHALL tener la estructura `{ "games": [...], "adminKeyHash": "<hex>" }` donde cada juego es `{ id: number, date: string, players: [{ name: string, points: number }] }` y `adminKeyHash` es el hash SHA-256 (hex) de la clave de admin vigente. Si el archivo existe sin el campo `adminKeyHash` (archivo creado por una versión anterior), el sistema SHALL tratarlo como si la clave vigente fuera la clave por defecto y persistir el hash correspondiente en la siguiente escritura.

#### Scenario: Lectura de partidas persistidas
- **WHEN** el archivo contiene 2 juegos
- **THEN** la capa de storage devuelve los 2 juegos con sus `id`, `date` y `players` intactos

#### Scenario: Escritura de nueva partida
- **WHEN** se registra una nueva partida
- **THEN** el archivo JSON se reescribe incluyendo la nueva partida junto con las existentes y el campo `adminKeyHash`

#### Scenario: Archivo antiguo sin adminKeyHash
- **WHEN** el archivo existe con solo `{ "games": [...] }` (sin `adminKeyHash`)
- **THEN** la lectura de partidas funciona normalmente y la verificación de clave usa la clave por defecto
- **AND** la siguiente escritura persiste el archivo con `adminKeyHash` presente

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
