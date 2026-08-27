# Design: persist-data-across-deploys

## Context

Los datos viven en `backend/data/scoreboard.json` (store JSON en `src/storage.js`, con seed de ejemplo si el archivo no existe y override por `DATA_FILE`). Hoy:

- `docker-compose.yml` monta `./backend/data:/app/data` (bind mount atado al directorio del repo).
- `backend/data/scoreboard.json` **está versionado en git** (contiene el seed de 3 partidas).
- `.dockerignore` excluye `data` de la imagen: sin mount, el contenedor arranca vacío y el seed se regenera.

Consecuencia: cada redeploy que reemplaza el código en el servidor (clone nuevo o checkout forzado) restaura el seed sobre los datos reales → las partidas "se borran".

## Goals / Non-Goals

**Goals:**
- Los datos sobrevivir a cualquier redeploy del código, sin depender del directorio del repo.
- Que git nunca vuelva a distribuir/overwritar el archivo de datos.

**Non-Goals:**
- No migrar a una base de datos externa (Postgres, etc.).
- No cambiar el formato del JSON, la API ni el seed.
- No replicación ni backups automáticos.

## Decisions

1. **Volumen named de Docker** (`catan-data` declarado en el top-level `volumes:` de compose, montado en `/app/data`) en lugar del bind mount.
   - Por qué: con deploy por clone nuevo, el bind mount apunta a un directorio del repo que no tiene datos (o trae el seed); el volumen named vive en el almacenamiento de Docker y sobrevive a reemplazos del repo, rebuilds de imagen y `docker compose down`.
   - Alternativa descartada: mantener bind mount y solo des-versionar el archivo — sigue fallando: el clone nuevo no trae `backend/data/`, el host crea el dir vacío y el seed regenera todo.
2. **Des-versionar el archivo de datos**: `git rm --cached backend/data/scoreboard.json` + `backend/data/` en `.gitignore`. El seed queda en `SEED_GAMES` (storage.js), sin cambios; el archivo se crea en el primer arranque dentro del volumen.
3. **Migración de un solo uso en el servidor** (datos existentes en `./backend/data/scoreboard.json`):
   1. `docker compose up -d` (crea el volumen y lo siembra)
   2. Si el archivo viejo existe y tiene datos reales: `docker compose cp backend/data/scoreboard.json backend:/app/data/scoreboard.json` (la copia escribe a través del mount → al volumen) y `docker compose restart backend`.
   Si el archivo viejo es solo el seed, el paso se omite (sobrescribir seed con seed es inocuo).
4. `DATA_FILE` (tests) y `SEED_GAMES`: sin cambios.

## Risks / Trade-offs

- [El hosting destino no soporta volúmenes persistentes (PaaS efímero)] → un volumen named no resuelve ese caso; haría falta DB externa. Verificar que el deploy sea VPS con Docker (ver Open Questions).
- [`docker compose cp` exige contenedor corriendo] → la migración se documenta como up → cp → restart, en ese orden.
- [Perder el archivo viejo sin migrar] → el README documenta el paso; el volumen creado por el primer `up` conserva el seed hasta que se copie.

## Migration Plan

En el servidor: actualizar el código → `docker compose up -d` → (si aplica) `docker compose cp backend/data/scoreboard.json backend:/app/data/scoreboard.json && docker compose restart backend`. Rollback: revertir compose al bind mount; los datos del volumen named quedan intactos y el flujo viejo vuelve a funcionar.

## Open Questions

(resueltas) El deploy destino es **Dokploy** (git → docker compose, contenedores con soporte de volúmenes): el volumen named persiste entre redeploys. Alternativa ofrecida por el usuario — BD en un contenedor nuevo o SQLite — descartada: el volumen named resuelve la persistencia con cero cambios de código; migrar el storage a SQL implicaría reescribir `storage.js`, una dependencia nueva y migrar datos existentes.
