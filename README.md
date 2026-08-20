# AirWatch

Delhi ward-level air quality dashboard. The UI is React; the API is Express. Live readings come from [WAQI / AQICN](https://aqicn.org/api/) and Open-Meteo. MongoDB can store wards if available.

## What it does

- Shows current AQI for a set of Delhi wards
- Refreshes from live APIs (manual refresh + background)
- Issue report form and optional chat if you add an OpenAI key

## Stack

React 18, Vite, Tailwind, Express, MongoDB, WAQI.

## Setup

You need Node 18+ and, optionally, MongoDB. The API still returns live AQI if Mongo is down.

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `AQICN_TOKEN` — free token from https://aqicn.org/api/ (needed for real numbers)
- `MONGODB_URI` — local Mongo or Atlas
- `PORT` — keep `3001` locally (macOS AirPlay often occupies `5000`)
- `OPENAI_API_KEY` — only if you want the chat widget to answer

Then run two terminals:

```bash
npm run server      # API at http://localhost:3001
npm run dev         # UI at http://localhost:8080 (proxies /api to the backend)
```

## Scripts

| Command | What it runs |
| --- | --- |
| `npm run dev` | Vite frontend |
| `npm run server` | Express API |
| `npm run dev:server` | API with `--watch` |
| `npm run build` | Production frontend build |

## API

- `GET /api/health`
- `GET /api/wards`
- `GET /api/wards/:id`
- `POST /api/wards/update-aqi`
- `GET /api/dashboard` (wards + sources + recommendations; add `?refresh=1` to force a live refetch)
- `POST /api/chat` (needs OpenAI key)

## Notes

Ward coordinates live in `server/data/delhiWards.js`. AQI is pulled from nearby WAQI stations in one map request, not a separate call per ward.
# AirWatch
