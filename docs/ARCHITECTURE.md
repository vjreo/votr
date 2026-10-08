# VOTR Architecture

## Core principle: unbiased

VOTR exists to help voters make informed choices — not to steer them.

1. **No endorsements.** Never say "vote for X" or imply one candidate is better.
2. **Neutral tone.** Describe positions factually; avoid loaded language.
3. **Primary sources.** Link to official campaign sites, government records, and direct statements.
4. **When sources conflict, present both.** Show the disagreement with links; let the user decide.
5. **Clear attribution.** Every claim should trace to a source the user can verify.
6. **Do not editorialize.** Summarize; do not opine.

These rules apply to ballot copy in `web/src/data/ballot.ts`, office explainers in `web/src/data/offices.ts`, UI labels, and any future AI-generated content. Explainers describe powers and duties only — never which candidate would do what.

---

## Current product: web-first through Election Day

**Live:** [https://vjreo.github.io/votr/](https://vjreo.github.io/votr/)

Through **November 3, 2026**, the static web app is the primary product.

| Part | Status | Role |
|------|--------|------|
| `web/` | Active | Vite 6 + React 18. GitHub Pages. Bundled Mecklenburg 2026 ballot, district maps, and address points. No API. |
| `backend/` | Frozen | Keep CI green. No new features. Reserved for post-election expansion. |
| `mobile/` | Frozen | Expo React Native. Keep typecheck CI. No new features. |

Election Day is close; app-store review is too slow. After November 3, backend and native can return for multi-county coverage and accounts.

### Web app

```
Browser (https://vjreo.github.io/votr/)
  ├── AddressEntry — GPS icon, typed address + on-device suggestions, or pick by hand
  ├── YourBallot   — races, measures, private picks
  └── localStorage (`votr_data`) — address, districts, picks; never uploaded
```

**Lookup (all on-device)**

1. GPS uses the browser Geolocation API. Coordinates never leave the device.
2. Typed addresses match Mecklenburg GIS Master Address Points, split by ZIP and gzipped under `web/public/addresses/`. Autocomplete uses the same packs after a ZIP or the first few characters.
3. Districts are point-in-polygon against bundled GeoJSON in `web/public/districts/` (U.S. House, NC Senate, NC House, county commission, Charlotte city).
4. Manual fallback if GPS is blocked or the address is not in the county file.

**Data**

- Candidates and measures: `web/src/data/ballot.ts` (NCSBE / Mecklenburg BOE / campaign and WFAE sources).
- Office and measure explainers: `web/src/data/offices.ts` (NCGA, NC Courts, Mecklenburg BOCC, City of Charlotte, NCSBE, UNC School of Government / Judicial Branch). One-liners plus tap-for-more: powers, term, seats, current holder when known, and 2–3 local “what this means for you” facts. Sources and `lastChecked` on each record.
- Maps and addresses: see `web/public/districts/manifest.json` and `web/public/addresses/index.json`. City/town on Your districts uses the Charlotte polygon, then ZIP-to-town for Cornelius, Davidson, Huntersville, Matthews, and Pineville.

### Local development

```bash
cd web
npm ci
npm run dev          # http://localhost:5173/votr/
npm run typecheck
npm test
npm run build
```

`vite.config.ts` sets `base: '/votr/'` so local and Pages paths match.

Deploy: GitHub Actions (`.github/workflows/deploy-web.yml`) on `main` when `web/**` changes.

---

## Scope

Mecklenburg County, NC — 2026 General Election (November 3, 2026). Charlotte-area voters. The frozen backend still has NC-first seams for later expansion.

## Frozen backend (post-election)

The API, Postgres, Open States ingest, and source-reliability tools remain in `backend/` for CI and a later multi-county build. They are **not** used by the live web app.

Agent-layer seams (ballot ingest → candidate facts → policy research → synthesizer) live under `backend/services/` and `backend/data/ncCandidates.js`. Do not wire them into `web/` before Election Day.

The Expo app under `mobile/` includes a quarantined gamification module. The **web app has none** of that: no points, streaks, badges, quizzes, or accounts.

## Directory structure

```
votr/
├── web/                      # Live product
│   ├── src/components/       # AddressEntry, YourBallot, CandidateDetail
│   ├── src/utils/            # lookup, geo, localStorage
│   ├── src/data/ballot.ts
│   └── public/districts|addresses/
├── backend/                  # Frozen
├── mobile/                   # Frozen
└── docs/
```

## Privacy data flow (web)

1. User types an address, taps GPS, or picks a district.
2. Matching runs in the browser against bundled files (`connect-src 'self'`).
3. Result is stored only in `localStorage`.
4. Picks (likely / considering / probably not) stay on that device.
5. Settings → Clear my picks wipes `votr_data`.
