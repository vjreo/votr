# VOTR Architecture

## Core Principle: UNBIASED

**VOTR exists to help voters make informed choices — not to steer them.**

The problem we solve is opinion/skew overload. Voters are bombarded with partisan takes, misleading headlines, and algorithm-driven echo chambers. VOTR cuts through the noise by presenting **neutral, factual ballot information** with clear source attribution.

### The Unbiased Rules

1. **No endorsements.** Never say "vote for X" or imply one candidate is better.
2. **Neutral tone everywhere.** Describe positions factually; avoid loaded language.
3. **Primary sources preferred.** Link to official campaign sites, government records, and direct statements.
4. **When sources conflict, present both sides fairly.** Show the disagreement with links; let the user decide.
5. **Clear attribution.** Every claim should trace to a source the user can verify.
6. **Synthesizer does not editorialize.** The brief summarizes; it does not opine.

These rules apply to:
- Candidate seed data (`ncCandidates.js`)
- Position descriptions and stances
- Source selection and ranking
- Any future AI-generated content
- UI copy and labels

---

## Current Strategy: Web-First Through Election Day

**Through November 3, 2026**, the static web app (`web/`) is the primary product.

- **Web app** (`web/`): Active development. Vite + React, deploys to GitHub Pages, bundles all Mecklenburg 2026 ballot data. No backend dependency. District lookup is on-device (browser geolocation or typed address against bundled county address points + GeoJSON).
- **Backend** (`backend/`): Frozen. Keep CI passing, but no new features. Preserved for post-election multi-county expansion.
- **Native app** (`mobile/`): Frozen. Expo React Native setup preserved for future app store builds with accounts and personalization.

This approach prioritizes speed-to-voters over features. Election Day is weeks away; app store review cycles are too slow. After November 3, the backend and native app will be revived for multi-county expansion and user accounts.

---

## Scope

**Current Focus**: Mecklenburg County, NC — 2026 midterm elections (November 3, 2026)

This is a dogfood build targeting Charlotte-area voters. The architecture is designed to scale to other locations, but the current implementation is NC-first.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VOTR Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐   │
│  │   Mobile    │     │                   Backend API                    │   │
│  │  (Expo RN)  │────▶│  /api/candidates  /api/sample-ballot  /api/bias │   │
│  └─────────────┘     └─────────────────────────────────────────────────┘   │
│                                       │                                     │
│                      ┌────────────────┼────────────────┐                   │
│                      ▼                ▼                ▼                   │
│               ┌──────────┐     ┌──────────┐     ┌──────────┐              │
│               │ Candidate │     │  Ballot  │     │   Bias   │              │
│               │  Ingest   │     │ Builder  │     │ Analysis │              │
│               │  (Seam 1) │     │ (Seam 2) │     │ (Seam 3) │              │
│               └──────────┘     └──────────┘     └──────────┘              │
│                      │                │                │                   │
│                      ▼                ▼                ▼                   │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                        Data Layer                                  │    │
│  │  PostgreSQL (candidates, elections, sources, users)               │    │
│  │  Open States API (NC legislators)                                 │    │
│  │  Media Bias Database (source reliability)                         │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent-Layer Seams

The codebase is designed with **four** clear seams for future multi-agent architecture. Each layer has a specific responsibility and must adhere to the UNBIASED principle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Agent Layer Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: BALLOT INGEST                                                     │
│  ─────────────────────                                                      │
│  What's on the ballot? Who filed? What offices?                            │
│  • NO opinions, just official filing data                                   │
│  • Source: state/county election boards, Open States                       │
│                                                                             │
│           ▼                                                                 │
│                                                                             │
│  Layer 2: CANDIDATE FACTS                                                   │
│  ────────────────────────                                                   │
│  Who is this person? Career history, current office, party.                │
│  • Biographical facts only — no characterizations                          │
│  • Source: official bios, government records                               │
│                                                                             │
│           ▼                                                                 │
│                                                                             │
│  Layer 3: POLICY/SOURCE RESEARCH                                           │
│  ───────────────────────────────                                           │
│  What positions has the candidate taken? What sources cover them?          │
│  • Describe positions in the candidate's own words when possible          │
│  • When sources conflict, include BOTH with attribution                    │
│  • Rank sources by reliability, not by agreement with any viewpoint       │
│                                                                             │
│           ▼                                                                 │
│                                                                             │
│  Layer 4: SYNTHESIZER BRIEF                                                │
│  ──────────────────────────                                                │
│  Summarize for the voter in neutral language.                              │
│  • MUST NOT editorialize or recommend                                      │
│  • Present facts; let the voter decide                                     │
│  • Always include source links for verification                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Seam 1: Ballot Ingest

**Location**: `backend/services/stateHandlers/`, `backend/data/ncCandidates.js`

**Purpose**: Fetch and normalize ballot data — what races exist, who filed.

**Unbiased rule**: This layer contains NO opinions. It answers "what's on the ballot?" with official data only.

**Current implementation**:
- Curated seed data in `ncCandidates.js` (U.S. Senate, U.S. House, state legislature, local)
- Open States API for NC state legislators (`openStatesApi.js`)
- State handler pattern (`NCStateHandler`) for NC-specific election rules

**Future agent work**:
- Automated scraper for NC Board of Elections filing data
- Ballotpedia API integration (commercial)

**Extension point**: Add new state handlers in `backend/services/stateHandlers/handlers/` and register them in `stateRegistry.js`.

### Seam 2: Candidate Facts

**Location**: `backend/data/ncCandidates.js` (bio, career fields), `backend/repositories/candidateRepository.js`

**Purpose**: Store biographical facts about candidates.

**Unbiased rule**: Facts only — no characterizations like "controversial" or "popular." Describe career history, offices held, and party affiliation without editorializing.

**Current implementation**:
- Manual bio and career data in candidate seed files
- Career history with dates and titles

**Future agent work**:
- Agent that extracts career facts from official sources (FEC, state records)
- Automated Wikipedia/Ballotpedia fact extraction (with verification)

### Seam 3: Policy/Source Research

**Location**: `backend/services/biasDetection.js`, `backend/services/sourceRanking.js`, `backend/data/mediaBiasDatabase.js`

**Purpose**: Research candidate positions and rank sources by reliability.

**Unbiased rules**:
- Describe positions using the candidate's own words when possible
- When sources conflict, **present both sides with links** — do not pick a winner
- Rank sources by factual reliability, not by political leaning
- A "left-leaning" and "right-leaning" source can both be reliable if factually accurate

**Current implementation**:
- Position data with `stance` field (should use neutral language)
- Bias detection using:
  - Local media bias database (reliability scores)
  - Optional Hugging Face ML analysis
  - Optional OpenAI content analysis
  - User feedback scores
- Source ranking by `biasTier`: most_reliable → reliable → use_caution → highly_biased

**Future agent work**:
- Position extraction agent that reads candidate statements and attributes them
- Source discovery agent that finds coverage from multiple perspectives
- Conflict detector that flags when sources disagree and presents both

**Extension point**: Add new analysis backends in `backend/integrations/`.

### Seam 4: Synthesizer Brief (Presentation API)

**Location**: `backend/routes/candidates.js`, `backend/routes/sampleBallot.js`

**Purpose**: Expose ballot data for apps, bots, or CLI tools. Generate neutral summaries.

**Unbiased rules**:
- **Never recommend a candidate.** The API returns facts; the user decides.
- Match scores show alignment with user-stated preferences, not "who you should vote for"
- Any AI-generated summaries must be reviewed for neutral tone
- Always include source links so users can verify claims

**Current implementation**:
- REST API endpoints for candidates, sample ballot, elections
- Match scoring based on user's issue preferences (not VOTR's opinion)
- Source ranking with bias tiers and links

**API endpoints for bot integration**:

```bash
# Get candidates for NC (optionally with lat/lng for district-specific)
GET /api/candidates?state=NC&lat=35.2271&lng=-80.8431

# Get sample ballot
GET /api/sample-ballot?state=NC&lat=35.2271&lng=-80.8431

# Get upcoming elections
GET /api/elections/upcoming

# Analyze source reliability (not "bias" in the partisan sense)
POST /api/bias/analyze
Body: { "url": "https://example.com/article" }
```

**Future agent work**:
- Slack/Discord bot that answers "who's on my ballot?" with neutral summaries
- CLI tool for terminal-based ballot lookup
- Conversational agent for guided research (must follow unbiased rules)

## Directory Structure

```
votr/
├── backend/
│   ├── routes/              # API endpoints
│   ├── services/
│   │   ├── stateHandlers/   # SEAM 1: State-specific ballot logic
│   │   ├── biasDetection.js # SEAM 2: Source analysis
│   │   └── sourceRanking.js # SEAM 2: Source ranking
│   ├── integrations/        # External APIs (OpenAI, HuggingFace, MediaBias)
│   ├── data/
│   │   └── ncCandidates.js  # SEAM 1: Curated candidate data
│   └── repositories/        # Database access
├── mobile/
│   ├── features/
│   │   ├── candidates/      # Browse/swipe candidates
│   │   ├── elections/       # Ballot, polling places
│   │   └── gamification/    # Quarantined in MVP mode
│   └── shared/
│       └── config/features.ts # Feature flags
├── shared/
│   └── types/               # Shared TypeScript types
└── docs/
    └── ARCHITECTURE.md      # This file
```

## Feature Flags

The mobile app uses feature flags in `mobile/shared/config/features.ts`:

| Flag | Default | Description |
|------|---------|-------------|
| `mvpMode` | `true` | Enables lean dogfood mode |
| `showDiscoverTab` | `false` | Browse all candidates |
| `showJourneyTab` | `false` | Gamification (streaks, achievements) |
| `showDailyLessons` | `false` | Civic education content |
| `showPolicyQuiz` | `false` | Policy preference quiz |

Set `EXPO_PUBLIC_MVP_MODE=false` to enable all features.

## Data Flow

1. **User enters address** → stored in `users.location`
2. **App requests candidates** → `GET /api/candidates?state=NC&lat=...&lng=...`
3. **Backend merges sources**:
   - Curated DB candidates (governor, senate, local)
   - Open States API (state legislators by district)
4. **Response includes**: name, party, office, positions, sources, match score
5. **User views candidate detail** → sources ranked by bias tier
6. **User adds to roster** → saved in `user_roster` table

## Local Development

See [README.md](../README.md) for setup instructions.

Quick start:
```bash
# Backend
cd backend && npm install && npm run dev

# Seed NC candidates
npm run db:seed && npm run db:seed:nc:force

# Mobile
cd mobile && npm install && npx expo start
```

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `OPEN_STATES_API_KEY` — Required for NC legislators (free at openstates.org)
- `JWT_SECRET` — Auth token signing key
- `HUGGINGFACE_API_KEY` — Optional ML bias analysis
- `OPENAI_API_KEY` — Optional content analysis

### Mobile (`mobile/.env`)
- `EXPO_PUBLIC_API_URL` — Backend API URL (e.g., `http://localhost:3000/api`)
- `EXPO_PUBLIC_MVP_MODE` — Set to `false` to enable full feature set
