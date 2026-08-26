# Spec: scoreboard-storage

## MODIFIED Requirements

### Requirement: Persistencia en archivo JSON local
El sistema SHALL persistir las partidas y las temporadas en un archivo JSON local (`data/scoreboard.json` dentro del backend, configurable por variable de entorno para fines de test). El archivo SHALL tener la estructura `{ "games": [...], "adminKeyHash": "<hex>", "seasons": [...] }` donde cada juego es `{ id: number, date: string, players: [{ name: string, points: number }] }`, `adminKeyHash` es el hash SHA-256 (hex) de la clave de admin vigente y cada temporada es `{ id: number, name: string }`. Si el archivo existe sin el campo `adminKeyHash` (archivo creado por una versión anterior), el sistema SHALL tratarlo como si la clave vigente fuera la clave por defecto y persistir el hash correspondiente en la siguiente escritura. Si el archivo existe sin el campo `seasons`, el sistema SHALL tratarlo como lista de temporadas vacía y persistir el campo en la siguiente escritura.

#### Scenario: Lectura de partidas persistidas
- **WHEN** el archivo contiene 2 juegos
- **THEN** la capa de storage devuelve los 2 juegos con sus `id`, `date` y `players` intactos

#### Scenario: Escritura de nueva partida
- **WHEN** se registra una nueva partida
- **THEN** el archivo JSON se reescribe incluyendo la nueva partida junto con las existentes, el campo `adminKeyHash` y el campo `seasons`

#### Scenario: Archivo antiguo sin adminKeyHash
- **WHEN** el archivo existe con solo `{ "games": [...] }` (sin `adminKeyHash`)
- **THEN** la lectura de partidas funciona normalmente y la verificación de clave usa la clave por defecto
- **AND** la siguiente escritura persiste el archivo con `adminKeyHash` presente

#### Scenario: Archivo sin campo seasons
- **WHEN** el archivo existe sin el campo `seasons`
- **THEN** la lista de temporadas se trata como vacía (no falla la lectura)
- **AND** la siguiente escritura persiste el archivo con `seasons` presente

#### Scenario: Escritura de nueva temporada
- **WHEN** se crea una nueva temporada
- **THEN** el archivo JSON se reescribe incluyendo la nueva temporada junto con las existentes, las partidas y el campo `adminKeyHash`
