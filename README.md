# VOTR — Informed Voting Without the Spin

VOTR helps voters get **unbiased, synthesized ballot information** without doing heavy research alone.

> **Current Scope**: Mecklenburg County, NC — 2026 midterm elections (November 3, 2026)
>
> This is a dogfood build for Charlotte-area voters. The architecture supports expansion to other locations.

## Core Principle: UNBIASED

**VOTR exists to inform, not to steer.**

The problem: voters are overwhelmed by partisan takes, misleading headlines, and algorithm-driven echo chambers. VOTR cuts through the noise by presenting neutral, factual ballot information with clear source attribution.

- **No endorsements.** We never tell you who to vote for.
- **Neutral tone.** Positions are described factually, not editorially.
- **Primary sources.** Links to official campaign sites and government records.
- **Both sides when they conflict.** If sources disagree, we show both with links.
- **You decide.** Match scores reflect YOUR stated priorities, not our opinion.

## Features

- **Ballot Overview**: See what's on your ballot for Mecklenburg County
- **Candidate Briefs**: Neutral summaries with positions and career history
- **Source Transparency**: Every claim links to a verifiable source
- **Preference Matching**: Optional — tell us your priorities, see alignment scores
- **Reliability Indicators**: Sources ranked by factual reliability (not partisan lean)

## Project Structure

```
votr/
├── backend/              # Node.js/Express API
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   │   └── stateHandlers/ # NC-specific ballot logic (agent seam)
│   ├── data/             # Curated candidate data
│   └── integrations/     # External APIs (OpenAI, bias DBs)
├── mobile/               # React Native app (Expo)
│   ├── features/
│   │   ├── candidates/   # Browse & compare candidates
│   │   ├── elections/    # Ballot, calendar, polling
│   │   └── gamification/ # Quarantined in MVP mode
│   └── shared/           # UI components, config
├── shared/               # Shared TypeScript types
└── docs/
    └── ARCHITECTURE.md   # Agent-layer seams & unbiased rules
```

## Quick Start (Dogfood)

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Open States API key (free at [openstates.org](https://openstates.org/accounts/signup/))

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env: set DATABASE_URL, OPEN_STATES_API_KEY, JWT_SECRET

# Create database and run migrations
createdb votr
npm run db:migrate

# Seed NC candidate data
npm run db:seed           # Issues, test users
npm run db:seed:nc:force  # 2026 NC candidates (Mecklenburg focus)

# Start server
npm run dev
```

API runs at `http://localhost:3000`

### 2. Mobile Setup

```bash
cd mobile
npm install

# Create .env
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env

# Start Expo
npm start
# Press 'i' for iOS simulator or 'a' for Android
```

### 3. Test the Ballot Flow

1. Open app → Enter a Charlotte address (e.g., `525 N Tryon St, Charlotte, NC 28202`)
2. Complete onboarding (select issues you care about)
3. Browse candidates → See neutral briefs with sources
4. View Sample Ballot → Races for Mecklenburg County 2026

## Bot/CLI Integration

The API can be called by a bot or CLI for ballot lookups:

```bash
# Get candidates for Mecklenburg County
curl "http://localhost:3000/api/candidates?state=NC&lat=35.2271&lng=-80.8431"

# Get sample ballot
curl "http://localhost:3000/api/sample-ballot?state=NC&lat=35.2271&lng=-80.8431"

# Get upcoming elections
curl "http://localhost:3000/api/elections/upcoming"

# Check source reliability
curl -X POST "http://localhost:3000/api/bias/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for agent-layer seams.

## API Endpoints

### Health
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Liveness check |
| `GET /health/ready` | Readiness (includes DB) |

### Candidates (Ballot Ingest + Facts)
| Endpoint | Description |
|----------|-------------|
| `GET /api/candidates` | List candidates. Query: `state`, `lat`, `lng`, `office` |
| `GET /api/candidates/:id` | Candidate detail with sources |
| `GET /api/candidates/:id/match-score` | Match score (requires auth) |

### Sample Ballot
| Endpoint | Description |
|----------|-------------|
| `GET /api/sample-ballot` | Ballot by address. Query: `state`, `lat`, `lng` |

### Elections
| Endpoint | Description |
|----------|-------------|
| `GET /api/elections` | List elections. Query: `state` |
| `GET /api/elections/upcoming` | Upcoming elections |

### Source Reliability
| Endpoint | Description |
|----------|-------------|
| `POST /api/bias/analyze` | Full reliability analysis. Body: `{url, content?}` |
| `GET /api/bias/quick` | Fast DB-only lookup. Query: `url` |
| `GET /api/bias/tiers` | Tier definitions (public) |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPEN_STATES_API_KEY` | Yes | Open States API key (free at openstates.org) |
| `JWT_SECRET` | Yes | Secret for auth tokens (32+ chars in production) |
| `PORT` | No | Server port (default: 3000) |
| `HUGGINGFACE_API_KEY` | No | ML-based content analysis |
| `OPENAI_API_KEY` | No | AI content analysis |

### Mobile (`mobile/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL |
| `EXPO_PUBLIC_MVP_MODE` | No | Set `false` to enable all features |

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Mobile**: React Native (Expo), TypeScript
- **Data Sources**: Open States API (NC legislators), curated seed data
- **Source Analysis**: Local bias DB, optional HuggingFace/OpenAI

## Architecture & Agent Seams

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:
- The four-layer agent architecture (Ballot Ingest → Candidate Facts → Policy Research → Synthesizer)
- Extension points for future automation
- The unbiased rules that every layer must follow

## Feature Flags

The mobile app uses MVP mode by default (lean dogfood):

| Flag | Default | Description |
|------|---------|-------------|
| `mvpMode` | `true` | Lean mode: Match + Shortlist + Profile only |
| `showDiscoverTab` | `false` | Browse all candidates by office |
| `showJourneyTab` | `false` | Gamification (quarantined for dogfood) |

Set `EXPO_PUBLIC_MVP_MODE=false` to enable full feature set.

## License

Private project - All rights reserved

