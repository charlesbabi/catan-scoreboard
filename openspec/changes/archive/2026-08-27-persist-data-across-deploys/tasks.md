# Tasks: persist-data-across-deploys

## 1. Docker Compose

- [x] 1.1 En `docker-compose.yml`: reemplazar el bind mount `./backend/data:/app/data` por un volumen named (declarado en `volumes:` a nivel superior, p. ej. `catan-data`, montado en `/app/data` del servicio backend)

## 2. Repositorio

- [x] 2.1 Quitar `backend/data/scoreboard.json` del índice de git (`git rm --cached backend/data/scoreboard.json`) y agregar `backend/data/` a `.gitignore`
- [x] 2.2 En `README.md`: nota breve de dónde persisten los datos (volumen named) y el paso de migración de un solo uso para servidores con datos existentes

## 3. Verificación

- [x] 3.1 `docker compose config` valida sin errores
- [x] 3.2 Con Docker disponible: `docker compose up -d`, registrar una partida vía API (`POST /api/games` con `X-Admin-Key`), `docker compose down && docker compose up -d` → la partida sigue presente (`GET /api/games`)
- [x] 3.3 Verificar que la copia de migración escribe al volumen: `docker compose cp backend/data/scoreboard.json backend:/app/data/scoreboard.json` (o un archivo de prueba) y confirmar contenido con `docker compose exec backend cat /app/data/scoreboard.json` tras `docker compose restart backend`
