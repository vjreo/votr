# Candidate & Sample Ballot Data Sources

## Current State (Mar 2025)

### Google Civic Information API – Removed

The Google Civic Information API has been **removed** from VOTR:
- **Representatives API** – Deprecated April 2025 (404)
- **Voterinfo** – NC elections often not in Google's list; unreliable for our use case

### Open States API (Primary for NC)

- **Endpoint**: https://v3.openstates.org/
- **Register**: https://openstates.org/accounts/signup/ → Profile → API Key (free)
- **Env**: `OPEN_STATES_API_KEY` in `backend/.env`

**Behavior:** Fetches NC state legislators (Senate + House) and US House members by jurisdiction or lat/lng. Merged with curated Governor, US Senate, and local offices from DB seed.

**Data extracted:**
- **Offices**: NC State Senate, NC House of Representatives, U.S. House of Representatives (when lat/lng provided)
- **Political career**: Built from Open States `roles` array (start_date, end_date, title); fallback to current role when no history

---

## In-App Sample Ballot

We build ballot data from:
1. **Open States** – NC state legislators + US House (by state or lat/lng)
2. **Curated DB** – Governor, US Senate, Charlotte Mayor (from seed) — includes political career for curated candidates

Fallback: **"Open NC Ballot Lookup"** – official NC State Board of Elections voter lookup (https://vt.ncsbe.gov/BallotLkup/).

---

## Ballotpedia API (Commercial)

Ballotpedia offers candidate and election data via a **paid API**:

- **Geographic APIs**: `/elections_by_state` – candidates by state and election date
- **Bulk Data**: CSV/JSON downloads refreshed daily
- **Access**: Requires annual subscription; contact data@ballotpedia.org for pricing
- **Docs**: https://developer.ballotpedia.org/

**Use case:** If you need broader state coverage, ballot measures, or more detailed candidate data than Open States provides, Ballotpedia is a commercial option. Not currently integrated.

---

## Other Options

1. **State-specific integrations**
   - NC Board of Elections: web only, no API
   - Other states may provide APIs (e.g. California, NY)

2. **Curated/manual data**
   - Seed DB with NC candidates when elections are announced
   - Use official state and county sources for contests

---

## Ensuring Users See Data

1. **Address required** – Candidate/sample ballot lookups use lat/lng when available for district-specific legislators.
2. **Official NC link** – Sample Ballot screen shows "Open NC Ballot Lookup" as fallback.
3. **OPEN_STATES_API_KEY** – Required for NC state legislators; without it, only seeded candidates appear.
