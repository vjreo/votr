# VOTR roadmap

November 15, 2026.

**North star:** every U.S. election. Federal, state, county, municipal, school board, and judicial contests; primaries, runoffs, specials, referendums, and bonds; every jurisdiction. Inform, don't persuade. No endorsements, no match scores, no one-sided arguments.

**Proving ground:** Mecklenburg County, North Carolina, 2026 general election. That static site is the product until a second jurisdiction is real data, not a plan.

Sizes: **S** is a local change in the current app. **M** is a feature or a content pass across the ballot. **L** is a new pipeline, a new hosting shape, or multi-jurisdiction work.

The technical design for the north star is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Where the product is today

- Live app: [vjreo.github.io/votr](https://vjreo.github.io/votr/). Vite, React, TypeScript, GitHub Pages. No server. Address lookup and picks stay on the device.
- One election, already held (November 3, 2026). The app is a record of that ballot. It does not show results.
- Ballot: statewide and local candidates with sourced positions, three constitutional amendments, three Charlotte bonds. Measures show what a for/yes vote does and what an against/no vote does, then easy-to-miss facts and a source. Each side's case renders only when both sides exist. They do not exist yet.
- Office explainers, district maps, and ZIP address packs are Mecklenburg-specific TypeScript and JSON, not a jurisdiction model.
- `backend/` (Express, Postgres, Open States, OpenAI) and `mobile/` (Expo) are frozen and unused by the live site. They are not the scaling plan. Match scores, media-bias ratings, and gamification stay out of the voter-facing product.
- No chat. No accounts on the web.

## Now

Keep the proving ground accurate. Do not start the national build.

- **Write paired, sourced arguments for the six measures.** Why: voters can see what a yes or no does, and they still cannot see each side's case. The screen hides the section until both sides exist. **M**
- **Decide results, then either link NCSBE or show certified totals with no commentary.** Why: the app now says it does not show results, and people will ask for them. **M**
- **Confirm the housing-bond label.** The card says "Affordable Housing ($125M)"; the ballot question says housing for low- and moderate-income residents. Why: the short title should not add a frame the official text does not use. **S**
- **Do not label an unmatched U.S. House point as NC-12.** Why: the fallback can attach the wrong House race while the screen says the district was unmatched. **S**
- **Move focus when opening a candidate, dates, or settings.** Why: keyboard and screen-reader users are left on a control that is no longer on screen. **S**
- **Re-check the October 24, 2026 position sources against the pages they cite.** Why: a record of the ballot still has to be true after the election. **M**

## Next

Prove the content shape on a second place before building a platform. Still static. Still no model in the request path. Chat stays unbuilt.

- **Add one more NC county as a second data pack behind the same screens.** Why: that is the cheapest test of whether Mecklenburg was a one-off. **M**
- **Put `state`, `county`, and `election` ids on the ballot records without changing the layout.** Why: districts are a three-value union and Charlotte is a boolean, which will not survive county two. **M**
- **Split the election (date, type, jurisdiction) out of the deadline list.** Why: the next cycle is not another copy of November 3, 2026. **S**
- **Add Clerk of Superior Court if that contest belongs on the ballot.** Why: the office explainer exists and the race is absent. **S**
- **Search more than the first ZIP pack when a street has no ZIP yet.** Why: suggestions can miss the address the voter meant. **M**
- **Keep GitHub Pages until previews or a second county make a move worthwhile.** Why: hosting is not the constraint yet. **S**

## Later

This phase is the north star. Mecklenburg remains the first corpus the new pipeline must reproduce exactly, including the neutrality rules.

### Data model

- **Jurisdiction tree and ballot styles.** Country, state, county, municipality, school district, judicial district, special district, and precinct only where the ballot splits. A ballot style is the set of contests and measures one precinct shares. Why: a page per address will not scale, and a legislative district is the wrong unit for school boards and city limits. **L**
- **Election calendar.** General, primary, runoff, special, and municipal cycles, each with a date and a jurisdiction. Why: the product is elections, not one general. **M**
- **Contest, candidate, and measure records as specified in ARCHITECTURE.md.** Official question text verbatim. Yes/no effects. Paired cases. Easy-to-miss facts. Source and `last_checked` on every claim. Why: the proving-ground screen already expects that shape. **L**

### Ingestion

- **One adapter per source, official board first.** NCSBE for North Carolina, then each new state's election board. Open States for legislator identities when the board file is thin. Why: there is no national official API, and secondary sources must not overwrite the ballot question. **L**
- **Ballotpedia or Democracy Works only with a license, and only to fill gaps.** Why: national coverage of every contest is not realistic from hand-maintained TypeScript, and those services are paid. **L**
- **Do not revive Google Civic.** Why: the API used by the frozen backend was deprecated. **S** as a rule, already in force.
- **Cursor SDK agents draft explainers into a pull request or a review queue.** A person publishes. CI rejects missing sources, loaded words, and a case that has only one side. Why: synthesis at national scale is only acceptable if every line is sourced and reviewable. **L**

### Delivery

- **Static JSON per ballot style, content-hashed and cached.** Why: the site can stay a static read of a published corpus instead of a per-voter render. **L**
- **Per-county address packs, loaded after the county is known, matched on the device.** A geocoder only when a county has no pack, and it must not log the address. Why: one national address file cannot be shipped to the browser, and the privacy promise is the product. **L**
- **Move the site to Vercel** when preview deploys or the CDN cache matter. User-facing AI, if it is built, uses the Vercel AI SDK against the published corpus, cites sources, and refuses a recommendation. Why: that matches the hosting and AI split Vince uses, and it keeps generation off the live answer. **L**

### Coverage order

- **Remaining NC counties, then odd-year municipal and school-board elections in the same state.** Why: the election board, the calendar, and the address-pack pattern get proven before a second state. **L**
- **Other states, then every election type in the north star.** Why: adapters differ by state, and the model has to hold a primary and a bond referendum, not only a November general. **L**

### Leave behind

- **Do not port match scoring, voter-facing bias ratings, or mobile gamification.** Why: each one tells the voter what to think. **S** as a constraint on every later project.
- **Accounts stay off unless the device-only promise is explicitly changed.** Why: picks and addresses are private because they never leave the phone. **M** if the decision is to add them.

## Known tech debt

- Ballot copy and explainers are duplicated (`ballot.ts` explanations and `offices.ts`). The screen prefers the explainer.
- `YourBallot.tsx` carries its layout in a large style string.
- Unknown congressional polygons fall back to NC-12 (`lookup.ts`). Covered above as a Now fix.
- Town names outside Charlotte are a five-ZIP table.
- Web unit tests run in `America/New_York` so the November daylight-saving fallback does not inflate the day count. Do not drop that from the npm script.
- Vitest 3 has a development-only advisory whose fix is Vitest 5, a major upgrade. It is not in the client bundle. Vite is on 6.4.6 for a dev-server advisory.
- The frozen backend prints demo seed passwords to the console, calls OpenAI, and ships a media-bias table. None of that is in the web build. Do not copy it forward.
- `LAUNCH_GUIDE.md`, `LAUNCH_CHECKLIST.md`, and `PRODUCTION_READINESS.md` still describe a pre-election launch of the API and the native app.
- The web package is not in the root npm workspaces. Root `npm run dev` starts the frozen backend.
- `base: '/votr/'` is a GitHub Pages detail.

## Open questions for Vince

1. After certification, should VOTR show official results, or stay a ballot record with a link to NCSBE?
2. Is the housing bond's public title "Affordable Housing," or should the card use the bond-order name?
3. Which county is second, and is it still in North Carolina?
4. When is the move from GitHub Pages to Vercel actually worth doing?
5. Is there budget for Ballotpedia or Democracy Works, or do we stay on official files until there is?
6. Is "nothing leaves this device" permanent, or are accounts in scope someday?
7. Confirm chat stays later, and that it is not allowed to recommend a vote.
8. Who besides you may approve an agent-drafted explainer before it is published?
9. Are Charlotte's odd-year municipal and school-board elections the next proving ground, before any other state?
10. When the election id changes, should saved picks be cleared or kept?
