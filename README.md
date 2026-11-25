# Study Plan

A frontend-only study planner built with Vite and React. Create and manage up to 20 study plans, track completion independently, and edit activity names. Plans are generated in the browser and saved locally on the device.

## Setup

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — create a production build in `dist`
- `npm run preview` — serve the production build locally
- `npm test` — run pure plan, validation, and local-storage logic tests
- `npm run lint` — lint the application and configuration
- `npm run format` — format project files with Prettier

## Plan logic

The browser validates the subject, exam date, and weekly study hours before creating a plan. The exam date is compared using local calendar dates. The plan divides available hours into one- or two-hour sessions, distributes study phases through the weeks, reserves the final week for revision and a mock test, and keeps only final complete weeks if the 200-activity cap would be exceeded. A plan under seven days is scaled to the remaining days.

Plans and activity completion are stored in local storage. Existing single-plan data is migrated automatically to the multi-plan format without losing completion state.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Select **Vite** as the framework preset.
3. Set **Root Directory** to the repository root.
4. Configure no environment variables, then deploy.

Vercel serves the static production build and applies the response security headers defined in `vercel.json`.
