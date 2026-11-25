# Study Plan

A small, stateless study-planning app. Create and switch between up to 20 week-by-week study plans, each based on a subject, exam date, and available study hours. Plans and their individual activity completion state are kept in the browser's local storage. Existing single-plan data is migrated to the new multi-plan format automatically.

## Setup

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run install:all
cp server/.env.example server/.env
npm run dev
```

The client runs at <http://localhost:5173> and proxies API requests to the server at <http://localhost:3001>. `server/.env` is optional for defaults; do not commit it.

## Commands

- `npm run dev` — run client and server together
- `npm test` — run backend unit and API tests
- `npm run lint` — lint both applications
- `npm run format` — format both applications with Prettier
- `npm --prefix client run build` — create a production client build

## API

- `GET /api/health` returns `{ "status": "ok" }`.
- `POST /api/plan` accepts JSON `{ "subject": "Biology", "examDate": "YYYY-MM-DD", "hoursPerWeek": 6 }`.

The response contains the normalized input, number of weeks, activities (`id`, `name`, `duration`, `week`, `phase`), and truncation metadata. Errors use `{ "error": { "message": "...", "details": ..., "requestId": "..." } }`. Every response includes `X-Request-Id`.

## Environment

See [server/.env.example](server/.env.example) for supported settings. CORS is restricted to `CLIENT_ORIGIN`. General and plan endpoint rate limits have configurable window and request limits.
