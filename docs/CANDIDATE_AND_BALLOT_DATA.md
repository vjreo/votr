# Candidate & Sample Ballot Data Sources

## Current State (Feb 2025)

### Google Civic Information API

| Endpoint | Status | Notes |
|----------|--------|-------|
| **Voterinfo** (with electionId) | ✅ Works | Returns contests for a given election; limited election list |
| **Voterinfo** (no electionId) | ⚠️ 400 for NC | "Next election" lookup may not work for all states |
| **Representatives** | ❌ 404 | **Deprecated** – Google turned it down (announced April 2024, effective April 2025) |

### Google Elections List

As of Feb 2025, the Civic API returns only a few elections:
- VIP Test Election (national test)
- Texas primaries (March 2026)
- Wisconsin primary (Feb 2026)

**No North Carolina elections** are currently in Google’s list. NC elections may appear closer to election day.

---

## In-App Sample Ballot

We pull ballot data from:
1. Voterinfo without electionId
2. Voterinfo with each upcoming election from the elections list
3. Representatives API (legacy, currently 404)

For **NC addresses**, all of these paths can return empty, so we fall back to **“Open NC Ballot Lookup”**, which opens the official NC State Board of Elections voter lookup.

### Official NC Sources

- **Sample ballot**: https://vt.ncsbe.gov/BallotLkup/
- No public API; interactive lookup only (name + address)

---

## Potential Alternatives

1. **Open States API** (https://v3.openstates.org/)
   - State legislators by lat/lng
   - Requires API key (free)
   - Geocode address → lat/lng → Open States `people.geo`

2. **State-specific integrations**
   - NC Board of Elections: web only, no API
   - Other states may provide APIs (e.g. California, NY)

3. **Curated/manual data**
   - Seed DB with NC candidates when elections are announced
   - Use official state and county sources for contests

---

## Testing

```bash
cd backend && npm run test:civic
```

This checks the Civic API with a Charlotte, NC address. If Representatives returns 404, that’s expected (deprecation). If Voterinfo fails, NC elections may not be in Google’s list yet.

---

## Ensuring Users See Data

1. **Address required** – Candidate/sample ballot lookups require a full voting address in Profile.
2. **Official NC link** – Sample Ballot screen always shows “Open NC Ballot Lookup” as a fallback.
3. **Strategy order** – We try: voterinfo (no ID) → voterinfo (with upcoming elections) → Representatives.
