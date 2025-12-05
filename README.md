# VirWorld

VirWorld is a single-user virtual world engine. The backend is Node/TypeScript + Express + Postgres + Redis. The frontend is a React SPA under `ui/`.

## Requirements

- Node.js (v18+)
- PostgreSQL
- Redis
- Qdrant (for vector memory)
- Venice API credentials (for LLM)

## Environment Variables

Create a `.env` file or set these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `QDRANT_URL`: Qdrant URL
- `VENICE_API_URL`: Venice API URL
- `VENICE_API_KEY`: Venice API Key
- `APP_ENV`: `production` (default) or `test`

## Installation and Migration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npm run migrate
   ```

## Running the Backend

Start the server:
```bash
npm start
```

The server runs on port 3000 by default.

## Running the UI

1. Navigate to the UI directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing

Run backend integration tests:
```bash
APP_ENV=test npm test
```

Run the verification script against deployed server:
```bash
BASE_URL=https://web-service-production-f0d9.up.railway.app ./world_tests.sh
```

## World Time

- World time is derived from OS time and `time_scale` in `world_state`.
- `/api/world/state` returns `world_time`, `paused`, and `time_scale`.
- Use `/api/world/pause`, `/api/world/resume`, and `/api/world/time/set-scale` to control time.

## UI Architecture

- The SPA connects to `/ws/timeline` for real-time updates.
- It uses `/api/scene/current-with-timeline` to rehydrate the timeline.
- `WorldControls` affect world time.
- `UserInput` sends actions to `/api/scene/act`.
 