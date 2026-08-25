# Proposal: add-catan-scoreboard

## Why

Nuestro grupo juega Catan de forma recurrente y no hay forma de llevar la cuenta de quién gana y quién pierde a lo largo de las partidas. Necesitamos un scoreboard simple que registre cada juego y la puntuación de cada jugador, sin fricción (sin login) y levantable con un solo comando.

## What Changes

- Nuevo backend en Node (sin autenticación) con API REST para registrar partidas de Catan y consultar el scoreboard.
- Almacenamiento en un archivo JSON local con datos de ejemplo precargados (seed) para ver cómo se carga.
- Nuevo frontend en React que muestra el listado de jugadores con su puntaje acumulado y permite registrar una nueva partida con el puntaje de cada persona.
- `docker-compose.yml` en la raíz para levantar backend y frontend juntos en Docker.
- Estructura de dos carpetas separadas: `backend/` y `frontend/`.
- Desarrollo TDD: toda la lógica (validación, agregación de puntajes, persistencia) se desarrolla escribiendo primero los tests.

## Capabilities

### New Capabilities

- `scoreboard-api`: API REST (sin auth) para listar el scoreboard agregado, listar partidas y registrar una nueva partida con el puntaje de cada jugador.
- `scoreboard-storage`: Persistencia en un archivo JSON local, con seed de datos de ejemplo cuando el archivo no existe.
- `scoreboard-frontend`: Aplicación React que consulta la API, muestra el ranking de jugadores y el historial de partidas, y permite registrar nuevas partidas.

### Modified Capabilities

(ninguna — proyecto nuevo, no hay specs existentes)

## Impact

- Código nuevo en `backend/`, `frontend/` y `docker-compose.yml` en la raíz del repo.
- Sin dependencias de sistemas existentes; no hay API previa que se modifique.
- Nuevo puerto expuesto por Docker (API y UI).
