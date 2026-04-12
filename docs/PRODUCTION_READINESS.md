# VOTR Production Readiness Summary

This document summarizes changes made to prepare VOTR for production use with live North Carolina data and a real user base.

## Backend

### Data & Elections
- **2026 NC elections** added to seed and `db/seed-elections.js` script
  - 2026 Primary Election (March 3, 2026)
  - 2026 General Election (November 3, 2026) with early voting dates
- **Open States API** is the primary source for NC state legislators (live data)
- **Curated candidates** (Governor, US Senate, local) from `db/seed:nc:force`
- New command: `npm run db:seed:elections` — adds 2026 elections (idempotent, safe to run repeatedly)

### Documentation
- **SETUP.md** — Updated to Open States (removed deprecated Google Civic API)
- **NEXT_STEPS.md** — Updated API setup instructions
- **CLAUDE.md**, **LAUNCH_GUIDE.md**, **LAUNCH_CHECKLIST.md** — Added `db:seed:elections` references

## Mobile UI/UX

### Accessibility
- Added `accessibilityRole` and `accessibilityLabel` to key interactive elements (Profile links, Roster remove buttons, Feed search bar)
- Theme includes `spacing.minTouchTarget: 44` (WCAG 2.1 minimum)
- Increased `hitSlop` to 12pt on touch targets for easier tapping

### Design Consistency
- Fixed SplashScreen color references (`colors.moss`, `colors.primary` instead of undefined `secondary`/`accent`)
- Added `secondary` and `accent` aliases to shared theme for backward compatibility
- CandidateDetailScreen header uses `surfaceElevated` instead of deprecated `secondary`
- DailyLessonScreen fun-fact callout uses theme colors

### Copy & Empty States
- **Roster empty state**: "Build your voting list" with clearer CTA and polling reference
- **Feed empty state**: Simplified messaging; clearer guidance to add address or browse Discover
- Copy aligns with demo flow: "perfect for reference at the polls"

## User-Base Readiness

### API & Error Handling
- **Request timeout**: 20s default on all API calls
- **User-friendly errors**: `getApiErrorMessage()` maps network/timeout/429/5xx to clear messages
- **Login/Register/Address**: Display API error messages to users instead of generic failures

### Security
- **JWT validation**: Server refuses to start in production if `JWT_SECRET` is missing or &lt; 32 chars
- **Rate limiting**: Auth (20/15min), API (120/min), Bias (20/min) — production only

### Profile & Legal
- **Privacy Policy** and **Terms of Service** links (update `PRIVACY_URL` / `TERMS_URL` in ProfileScreen when you have real URLs)
- **Sign Out** for authenticated users with confirmation
- **App version** displayed in Profile footer

### App Store
- **privacy**: `public` in app.json
- **usesNonExemptEncryption**: `false` for iOS (standard HTTPS only)
- Create actual Privacy Policy and Terms pages at votr.app before submission

## Deployment Checklist

1. **Backend**
   - Set `OPEN_STATES_API_KEY` (required for NC legislators)
   - Run `npm run db:migrate`
   - Run `npm run db:seed` (fresh install)
   - Run `npm run db:seed:nc:force` (curated + Open States merge)
   - Run `npm run db:seed:elections` (2026 elections)

2. **Mobile**
   - Set `EXPO_PUBLIC_API_URL` to production API
   - Test on device: address entry → onboarding → Feed → Roster flow

3. **App Store**
   - Screenshots, description, privacy policy URL
   - App icon 1024×1024

## Live NC Data Flow

- **Candidates**: Open States API fetches NC legislators on each `/api/candidates` request (with optional lat/lng for district-specific results). Merged with DB-curated Governor, US Senate, Charlotte Mayor.
- **Elections**: Stored in DB; `db:seed:elections` adds 2026 cycle. Mobile `upcomingElections.ts` drives Feed deadlines.
- **Sample ballot**: Built from same candidate sources; fallback link to NC Board of Elections voter lookup.
