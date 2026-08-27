# Catan Scoreboard

A simple scoreboard to register your Catan games and track player rankings.

## Features

- Register games with per-player points (2+ players, points ≥ 0)
- Aggregated ranking: total points, games played, wins (ties don't count as wins)
- Player names are normalized (case- and whitespace-insensitive grouping)
- Admin key protects game registration and key management (default: `catan`)
- Data persisted in a local JSON file, seeded with sample games on first run

## Tech Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Backend  | Node.js 20 (stdlib `http`, no framework)          |
| Frontend | React 19, Vite, react-router-dom                  |
| Storage  | JSON file (`backend/data/scoreboard.json`)        |
| Testing  | Node test runner (backend), Vitest (frontend)     |

## Getting Started

### Development

```bash
# Backend (http://localhost:3001)
cd backend
npm install
npm start

# Frontend (http://localhost:5173, proxies /api to :3001)
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
# Frontend: http://localhost:8090
# Backend:  http://localhost:3001
```

Los datos persisten en el volumen named `catan-data`, independiente del código (sobrevive a redeploys). Para migrar datos de una instalación previa con bind mount (`./backend/data`):

```bash
docker compose up -d
docker compose cp backend/data/scoreboard.json backend:/app/data/scoreboard.json
docker compose restart backend
```

## Environment Variables (backend)

| Variable    | Default                              | Description        |
| ----------- | ------------------------------------ | ------------------ |
| `PORT`      | `3001`                               | API port           |
| `DATA_FILE` | `backend/data/scoreboard.json`       | Storage file path  |

## API

| Method | Endpoint             | Description                                   | Auth        |
| ------ | -------------------- | --------------------------------------------- | ----------- |
| GET    | `/api/scoreboard`    | Aggregated player ranking                     | none        |
| GET    | `/api/games`         | All games, newest first                       | none        |
| POST   | `/api/games`         | Register a game `{ date?, players: [...] }`   | `X-Admin-Key` header |
| POST   | `/api/admin/verify`  | Verify admin key `{ key }`                    | none        |
| POST   | `/api/admin/key`     | Change admin key `{ currentKey, newKey }`     | valid `currentKey` |

Example:

```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: catan" \
  -d '{"date": "2026-08-24", "players": [{"name": "Ana", "points": 10}, {"name": "Beto", "points": 7}]}'
```

`date` is optional (defaults to today, `YYYY-MM-DD`).

## Tests

```bash
cd backend && npm test    # node --test
cd frontend && npm test   # vitest run
```

## Project Structure

```
backend/
  src/    server, storage, scoreboard logic (stdlib http)
  data/   scoreboard.json (created at first run)
  test/   API, storage and validation tests
frontend/
  src/    React app: game form, ranking view, admin key gate
docker-compose.yml
openspec/  specs and change history
```

## Security Notes

- The admin key is stored as a SHA-256 hash, never in plaintext.
- Key comparison uses constant-time comparison.
- CORS is open (`*`) — intended for private/home use. Put it behind a reverse proxy with TLS and auth if you expose it publicly.

## License

[MIT](./LICENSE)

## Credits

Created with [Qwen 3.8 UD Q4 K M](https://github.com/QwenLM).
