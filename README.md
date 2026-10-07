# VOTR

Nonpartisan ballot guide for Mecklenburg County, North Carolina — 2026 General Election (Tuesday, November 3).

**Live app:** [https://vjreo.github.io/votr/](https://vjreo.github.io/votr/)

VOTR helps you see what is on your ballot. We show candidate positions from their own words. We never tell you who to vote for.

## Current product

Through Election Day, **the static web app is the product**.

- **Web** (`web/`): Vite + React. Deploys to GitHub Pages. Bundles Mecklenburg 2026 races, maps, and address points. No backend. Address and GPS lookup stay on the device.
- **Backend** (`backend/`) and **native app** (`mobile/`): Frozen. Keep CI passing. No new features until after November 3.

## Unbiased rules

- No endorsements.
- Neutral tone. Positions in the candidate's own words when we have them.
- Primary sources, with links.
- If sources disagree, show both.
- You decide.

## Run the web app

Requires Node.js 18+.

```bash
cd web
npm ci
npm run dev
```

Open [http://localhost:5173/votr/](http://localhost:5173/votr/) (the app is served under `/votr/`, the same path as GitHub Pages).

```bash
npm run typecheck
npm run build
npm run preview   # production build at http://localhost:4173/votr/
```

Nothing is sent to a server. Typed addresses, GPS, and your picks stay in this browser (`localStorage` key `votr_data`). Settings → Clear my picks removes them.

## How lookup works

1. Type a street address and ZIP, tap the location icon for GPS, or pick your area by hand.
2. The app lazy-loads the matching ZIP’s address list and district GeoJSON from this origin.
3. Point-in-polygon matching runs in the browser.
4. Confirm with [NCSBE Voter Search](https://vt.ncsbe.gov/reglkup/) for the official sample ballot.

## Project layout

```
votr/
├── web/                 # Live product (GitHub Pages)
│   ├── src/             # React UI, on-device lookup
│   └── public/          # District GeoJSON + ZIP-split address packs
├── backend/             # Frozen API (CI only)
├── mobile/              # Frozen Expo app (CI only)
└── docs/
    ├── ARCHITECTURE.md
    └── SECURITY.md
```

## Deploy

Pushes to `main` that touch `web/**` run `.github/workflows/deploy-web.yml` and publish to GitHub Pages.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SECURITY.md](docs/SECURITY.md).
