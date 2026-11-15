# VOTR Architecture

## Unbiased, at any scale

VOTR informs. It does not persuade.

1. **No endorsements.** Never say "vote for X" or imply one candidate or one side of a measure is better.
2. **Neutral tone.** Describe powers, effects, and positions factually. No loaded language.
3. **Primary sources.** Official ballot text, election-board filings, and the candidate's own words come first. Link them.
4. **When sources conflict, present both.** Show the disagreement with links. The reader decides.
5. **Clear attribution.** Every claim traces to a source and a date it was checked.
6. **Do not editorialize.** Summarize. Do not opine.
7. **Same layout for every choice.** Candidates in a race share one component and sort A–Z by surname. A yes and a no on a measure use the same type styles. Party is a label, not a color.
8. **Arguments ship as a pair.** A case for a measure is shown only when a case against is present, and the reverse. `pairedArguments` in `web/src/data/offices.ts` enforces that. One side alone is an endorsement by omission.
9. **No scores.** Do not rank candidates, match a voter's "issues" to a candidate, or stamp a news outlet with a bias number in the product the voter sees.

These rules apply to ballot copy, office explainers, UI labels, and any future generated text. Explainers describe what an office or a vote does. They do not say which candidate would do what.

Chat, if it is ever added, is a reader of the published corpus. It cites sources and refuses "who should I vote for." It is not a current feature.

## North star

Cover **every U.S. election**: federal, state, county, municipal, school board, judicial, primaries, runoffs, specials, referendums, and bonds, in every jurisdiction.

**Mecklenburg County, North Carolina, is the proving ground.** The 2026 general ballot is the only live dataset. The target model below is the destination. This repository does not implement it yet.

## Stack today (November 15, 2026)

The live product is a static site. Election Day was November 3, 2026. The app is a record of that ballot. After the polls close it can show official totals from a `ResultsSource`. It does not project a winner.

| Part | Status | What it is |
|------|--------|------------|
| `web/` | Live | Vite 6 + React 18 + TypeScript. GitHub Pages at [vjreo.github.io/votr](https://vjreo.github.io/votr/). `base` is `/votr/`. No server. |
| `backend/` | Frozen | Express, Postgres, JWT accounts, Open States client, OpenAI and Hugging Face bias tooling. CI only. The web app does not call it. |
| `mobile/` | Frozen | Expo / React Native. CI typecheck. Includes accounts and a quarantined gamification module the web app does not have. |

There is no user-facing AI in the live app. Hosting is GitHub Pages, not Vercel. Vercel, the Vercel AI SDK, and the Cursor SDK are the **target** tools below. They are not dependencies of this repo today.

### Data flow today

```
Browser (GitHub Pages)
  AddressEntry
    GPS, or a typed address, or a manual U.S. House district + Charlotte yes/no
    → lazy-load one ZIP address pack and the district GeoJSON from this origin
    → point-in-polygon in the browser
  YourBallot
    candidates filtered by district
    measures: statewide questions, plus Charlotte bonds if isCharlotte
    private picks in localStorage key votr_data
```

Nothing in that path leaves the device. Content Security Policy is `connect-src 'self'`. Coordinates, typed addresses, and picks are not uploaded.

Lookup details:

1. GPS uses the browser Geolocation API.
2. Typed addresses match Mecklenburg GIS Master Address Points, split by ZIP and gzipped under `web/public/addresses/`.
3. Districts are polygons in `web/public/districts/` (U.S. House, NC Senate, NC House, county commission, Charlotte city limits).
4. If GPS is blocked or the address is missing, the voter picks an area by hand.
5. Official confirmation stays a link to [NCSBE Voter Search](https://vt.ncsbe.gov/reglkup/).

Content:

- Candidates and the official questions: `web/src/data/ballot.ts`.
- Plain-language office and measure explainers: `web/src/data/offices.ts`. Measures show, in order, what a for/yes vote does, what an against/no vote does, each side's case only when both exist, then easy-to-miss facts, then the source. The official wording is one tap away. Office rows still open with a one-line summary and a More disclosure.
- Picks stay on the device. Settings → Clear my picks wipes `votr_data`.

```bash
cd web
npm ci
npm run dev          # http://localhost:5173/votr/
npm run typecheck
npm test             # America/New_York, so deadline math matches NC
npm run build
```

Deploy: `.github/workflows/deploy-web.yml` on `main` when `web/**` changes.

## What is hardcoded to Mecklenburg and North Carolina

The live app is one county and one election, expressed as TypeScript constants rather than as data.

| Assumption | Where it lives |
|------------|----------------|
| Election is `2026-11-03`, named in copy and in `ELECTION` | `web/src/data/ballot.ts`, `web/index.html`, `web/src/site.ts` |
| U.S. House is only NC-8, NC-12, or NC-14. Anything else is stored as NC-12 | `UserLocation.district`, `lookupPoint` in `web/src/utils/lookup.ts` |
| Charlotte is a boolean, not a municipality id. It gates the three city bonds | `isCharlotte`, `CHARLOTTE_BONDS` |
| Other towns are five ZIP codes (Cornelius, Davidson, Huntersville, Matthews, Pineville). Everyone else is "Unincorporated Mecklenburg" | `web/src/utils/place.ts` |
| State legislative and commission contests are filtered by NC district number strings | `getCandidatesForLocation` |
| Office titles are matched with Mecklenburg prefixes ("Mecklenburg Sheriff", "NC Senate") | `officeIdFromBallotOffice` |
| Address packs, street index, and district GeoJSON are Mecklenburg files under `web/public/` | `lookup.ts`, `manifest.json` |
| Deadlines, voter-search URL, and provenance strings are NCSBE | `DEADLINES`, `OFFICIAL_SOURCES` |
| Measure explainers are a record keyed by 2026 ids | `MEASURES` in `offices.ts` |
| Manual entry offers three U.S. House districts and a Charlotte yes/no | `AddressEntry.tsx` |

A second county cannot be added by dropping files in a folder. The UI, the location type, and the filters would all need to change.

### Frozen backend is not a national model

`backend/` looks multi-state and is not the serving path.

- `config/states/states.json` lists every state and a timezone. `electionRules.json` has rough day-counts for NC, CA, CO, OR, and WA. `dataSourceConfig.json` is `db_only` for NC and the default. None of this is read by `web/`.
- Postgres tables `state_config`, `state_data_sources`, `elections` (state + district), `candidates` (state + office), and `ballot_measures` (state, county, city, election date) are a sketch of scope, not a jurisdiction tree. There is no precinct, no ballot style, no school district, and no election type.
- `NCStateHandler` still filters on `ocdDivisionId`, a leftover from the Google Civic Information API. That API was removed (Representatives endpoint deprecated April 2025). Do not bring it back.
- Open States is a reasonable **source of legislator identities**. It is not a sample ballot.
- `calculateMatchScore` aligns a user's issue picks with candidate positions. That is a recommendation. It does not belong in the voter-facing product.
- `mediaBiasDatabase.js`, the Hugging Face client, and the OpenAI bias analysis rate sources. The voter-facing rule is to show the source, not to score it.
- `mobile/` gamification (points, streaks, badges) stays out of the web app.

Keep the frozen projects compiling. Do not port them forward as the national architecture.

## Target architecture

Build a **published corpus**. The site renders that corpus. Models and agents may draft it. They do not answer the voter from an empty prompt.

### Jurisdiction and election model

Stable ids should follow the [OCD-ID](https://github.com/opencivicdata/ocd-division-ids) pattern (`ocd-division/country:us/state:nc/county:mecklenburg`) even though Google Civic is gone. The id scheme is public and is not an API.

```
Country (US)
  Jurisdiction tree
    state
      county
        municipality | school district | judicial district | special district
          precinct (only when the ballot actually splits)
    district plan (U.S. House, state senate, county commission, …)
      district geometry, source, last_checked
  Election
    id, date, type (general | primary | runoff | special | municipal)
    jurisdiction_id of who is holding it
  Ballot style
    the set of contests + measures one precinct shares
    this is what the client downloads, not a page per address
  Contest
    election_id, ballot_style_id, office, seats, district_id
  Candidate
    contest_id, name, party as registered
    positions[]: issue, paraphrase or quote, source url, checked date
  Measure
    election_id, jurisdiction_id
    kind: amendment | referendum | initiative | bond | levy
    official ballot question (verbatim)
    yes_means, no_means
    case_for[], case_against[]   # publish only as a pair
    easy_to_miss[]
    sources[], last_checked
```

Mecklenburg 2026 maps onto this without a redesign of the screen: one election, a handful of ballot styles (the styles differ mainly by congressional, legislative, commission district, and Charlotte city limits). `isCharlotte` is today's stand-in for a municipal split. Precinct is in the model because school boards, city annexations, and some referendums do not follow a legislative district. The proving ground does not need to geocode precincts until a contest actually splits inside a district.

### Ingestion, one adapter per source

```
SourceAdapter
  id
  covers(jurisdiction, election) -> boolean
  fetchContests / fetchMeasures / fetchGeometries
  each record: source url, retrieved_at, raw payload hash
```

Authority order:

1. **State or county election board** for who is on the ballot and the official question text. For the proving ground that is NCSBE and the Mecklenburg Board of Elections. Other states get their own adapter. There is no national official API.
2. **Campaign sites, legislative records, and questionnaires** for what a candidate said, quoted or closely paraphrased, with the URL.
3. **Open States** where a board file does not list legislators cleanly. Identities and offices, not a sample ballot.
4. **Ballotpedia or Democracy Works** only after a paid license is accepted, and only to fill gaps. They must not overwrite official question text.

Do not plan on Google Civic. It is deprecated.

### Results

`ResultsSource` in `web/src/results/types.ts` is one adapter per publisher. `covers(state, county, election)` decides who can answer. `load` returns contest totals, the publisher's own status word, a source URL, and that file's timestamp. It does not add a winner, a projection, or a party color.

The Mecklenburg adapter reads the NC State Board of Elections ENR file for county 60. Another county or state implements the same interface and does not need a new screen. Before the polls close, the screen says results are not yet available and does not read the totals.

A Cursor SDK agent may draft an explainer or a position summary. The draft is a pull request or a review item. It is not written to the live site. Publish rules, all required:

- Official question text is stored verbatim and shown as official wording.
- Every claim has an `https` source and a `last_checked` date.
- `case_for` and `case_against` are both non-empty or both absent.
- The existing neutrality checks (loaded words, identical candidate fields, no party colors) run on generated copy in CI.
- A person accepts the draft. The first reviewer is Vince until that role is explicitly shared.

### Delivery and cache

Generate **static JSON per ballot style**, content-hashed, cached for a long time. Rebuild when a reviewed publish lands. Do not render a personal ballot on a server for each address.

The client:

1. Voter chooses a state and county (or GPS / address resolves one).
2. The app loads that county's address pack or district tiles from this origin, the way Mecklenburg ZIP packs work today.
3. On-device point-in-polygon returns district ids and a ballot-style id.
4. The app fetches that style's JSON.

Nationwide address points cannot ship in one bundle. Mecklenburg's ZIP packs are about 6 MB gzipped and are already lazy-loaded. Keep that pattern per county. A server geocoder is a fallback for a county with no pack: accept the query, return districts, do not log the address, and say so on the screen. Prefer the on-device pack.

Uncommon styles can be generated on demand and then cached at the CDN. The common case stays prebuilt. Vercel's cache is the target once hosting moves. GitHub Pages is enough for one county.

`base: '/votr/'` exists so GitHub Pages project sites and local dev match. A Vercel project on its own domain would use `/`. That change waits for the hosting move.

### Hosting and AI tools

| Need | Tool | When |
|------|------|------|
| Static site, preview deploys, CDN cache | **Vercel** | When a second jurisdiction or preview content review needs it. Not in this change. |
| User-facing model calls | **Vercel AI SDK** | Only if a reader-facing assistant is built. It calls the published corpus, cites, and refuses a recommendation. |
| Background research and draft explainers | **Cursor SDK** | Agents open reviewable drafts. They do not talk to the voter. |

Do not add the AI SDK to the web bundle to "be ready." Chat is a later idea. The neutrality gate has to exist in the corpus first, which is what `pairedArguments` and the copy tests start.

### Cost and operations

The expensive parts are licenses and review time, not hosting.

- **One county, static files:** GitHub Pages or a Vercel hobby project. Hosting cost is negligible. The cost is checking sources.
- **More NC counties, still static:** Same hosting. Editor time grows with contests. Address packs stay per county.
- **Commercial ballot data:** Ballotpedia and Democracy Works require a quote. Do not assume a price, and do not start a national build on an unpaid scrape of those sites.
- **Address and boundary files:** Census TIGER places and districts are free and coarse. County address points are a county-by-county collection. Budget storage per county, not one national download into the browser.
- **Drafting agents:** A batch per contest around filing deadlines and again before election day. Review time dominates token cost. Keep prompts short and store the model id with the draft.
- **Database:** Postgres is for the ingestion workspace, not for serving pages. The frozen backend's database is not required to keep Mecklenburg online.
- **Ops:** An election calendar row opens a cycle. Each record has `last_checked`. The build fails if a published measure lacks yes/no text or a source. Preview the content PR before it is production. No secrets in the client bundle.

Do not run bias-classification models on the request path. That work is frozen and it conflicts with "show the source."

## Migration plan

The phases match [ROADMAP.md](ROADMAP.md). Mecklenburg stays served the whole time.

1. **Now.** Keep the proving-ground site honest: past-election note, measure layout, neutrality gates, no platform rewrite.
2. **Next.** One more jurisdiction as data, not as a new app. Add `state`, `county`, and `election` ids beside the current constants. Extract an election record from the hardcoded date. Still static, still on GitHub Pages, still no model in the request path.
3. **Later.** Implement the model above. First adapter is NCSBE (or the next state's board) writing the same JSON the site already renders. Then the review queue and Cursor SDK drafts. Move hosting to Vercel when previews or the cache matter. Add counties, then other states, then the election types the proving ground does not contain (primaries, runoffs, specials, school boards, municipal-only cycles). User-facing AI via the Vercel AI SDK is last, and only against the published corpus.

## Directory today

```
votr/
├── web/                      # Live product
│   ├── src/components/
│   ├── src/data/ballot.ts    # 2026 Mecklenburg ballot
│   ├── src/data/offices.ts   # Explainers and pairedArguments
│   └── public/districts|addresses/
├── backend/                  # Frozen. Not the national design.
├── mobile/                   # Frozen.
└── docs/
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```
