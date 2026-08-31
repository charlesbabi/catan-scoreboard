# Delta: scoreboard-storage

## ADDED Requirements

### Requirement: Eliminar partida
La capa de storage SHALL exponer `deleteGame(id)`: si existe una partida con el `id` dado, la elimina de la lista de partidas y reescribe el archivo JSON, devolviendo la partida eliminada; si no existe, SHALL devolver `null` sin modificar el archivo. El resto del documento (`seasons`, `adminKeyHash` y las partidas restantes) SHALL conservarse.

#### Scenario: Eliminación de partida existente
- **WHEN** el archivo contiene 3 partidas y se llama `deleteGame(2)`
- **THEN** devuelve la partida id 2 y el archivo queda con las 2 restantes, junto con `seasons` y `adminKeyHash`

#### Scenario: Eliminación de partida inexistente
- **WHEN** se llama `deleteGame(999)` y no existe ninguna partida con ese id
- **THEN** devuelve `null` y el archivo no se modifica
