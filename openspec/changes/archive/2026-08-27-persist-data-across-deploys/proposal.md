# Proposal: persist-data-across-deploys

## Why

Al redesplegar el proyecto en el servidor (nuevo clone o reemplazo del código) se borran las partidas: el archivo de datos está versionado en git (el seed lo sobrescribe) y el volumen de datos es un bind mount atado al directorio del repo, que se pierde al reemplazar el código.

## What Changes

- El backend persiste sus datos en un **volumen named de Docker** (independiente del directorio del repo) en lugar del bind mount `./backend/data:/app/data`.
- El archivo de datos `backend/data/scoreboard.json` **deja de estar versionado** en git (se ignora `backend/data/`); el seed de ejemplo se mantiene en el código (`SEED_GAMES`), no en el repo.
- Migración de un solo uso: las partidas existentes en `./backend/data/scoreboard.json` se copian al volumen antes del primer arranque con el nuevo compose.
- Documentación breve (README) sobre dónde vive el dato y el paso de migración.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-frontend`: el requirement de levantamiento con Docker Compose queda explícito en que los datos persisten en un volumen named que sobrevive a redesples (rebuild de imagen o reemplazo del repo), y el archivo de datos no se incluye en el repositorio.

## Impact

- `docker-compose.yml`: volumen named en lugar de bind mount.
- Git: `backend/data/scoreboard.json` se quita del índice; `backend/data/` se agrega a `.gitignore`.
- `README.md`: nota de persistencia/migración.
- Código del backend, API y frontend: sin cambios.
