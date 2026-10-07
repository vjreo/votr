# VOTR Security Model

This document describes the security measures implemented for the VOTR web application.

## Overview

VOTR is a static web application designed for privacy and security. The core principle is that **user data never leaves the device**.

## Security Measures

### 1. No Secrets in Client Bundle

- **No API keys, tokens, or credentials** are included in the client bundle
- No `.env` files or environment variables are used in the web build
- All ballot data is bundled statically — no backend API calls
- Build process includes automated scanning for sensitive patterns

**Verification:** Run `npm run build` and scan `dist/` for secrets:
```bash
grep -riE "(api[_-]?key|secret|password|database)" dist/ | grep -v "type=.password"
```

### 2. Device-Only Location Handling

Lookup is a single search field. A pin button requests GPS; typing an address can show on-device suggestions. Nothing in this flow is sent to a server.

**GPS (location icon)**

- The browser Geolocation API runs on-device
- Coordinates are matched against bundled GeoJSON (point-in-polygon in the browser)
- Coordinates **never leave the device** — no location API call
- District maps are lazy-loaded from this origin (`/votr/districts/*.json`)

**Typed address and autocomplete (on-device)**

Statewide NCSBE address-point files are ~210 MB, but Mecklenburg County GIS Master Address Points compress to about 6 MB of ZIP-split `.json.gz` files. VOTR lazy-loads only the ZIP the voter typed (typically ~100–350 KB). Suggestions use the same packs after a ZIP or the first few characters — they are not a network geocoder.

- The address is matched on this device against bundled county address points
- Nothing is sent to the U.S. Census Geocoder or any other server (the Census API does not allow browser CORS)
- Users can skip this and pick districts by hand, or confirm with [NCSBE Voter Search](https://vt.ncsbe.gov/reglkup/)

Address and district results stay in browser `localStorage` only.

### 3. No External Scripts or Trackers

- **No analytics** (no Google Analytics, Mixpanel, etc.)
- **No ad pixels** (no Facebook Pixel, etc.)
- **No third-party scripts** loaded at runtime
- **Self-hosted fonts** via `@fontsource/inter` (no Google Fonts CDN)
- All resources served from the same origin

### 4. Official Data Sources

All ballot data comes from official government sources:

| Data Type | Official Source |
|-----------|-----------------|
| Voter registration | [NCSBE Voter Search](https://vt.ncsbe.gov/reglkup/) |
| Statewide referendums | [NCSBE Elections Files](https://dl.ncsbe.gov/) |
| County referendums | [NCSBE County Referendums](https://dl.ncsbe.gov/) |
| Candidate positions | Official campaign websites, WFAE interviews |
| U.S. House districts | NCSBE / NCGA Session Law 2025-95 shapefile (2026 plan) |
| NC Senate / House districts | NCSBE / NCGA SL 2023-146 and SL 2023-149 shapefiles |
| County commissioner districts | Mecklenburg County GIS |
| Charlotte city limits | U.S. Census TIGER/Line 2024 places |
| Street addresses | Mecklenburg County GIS Master Address Points |

- **Last verified:** October 7, 2026
- App displays verification date and links to official sources
- Users are directed to NCSBE Voter Search for authoritative ballot information

### 5. Secure Deployment

The GitHub Actions workflow (`deploy-web.yml`) enforces:

**Least-privilege permissions:**
```yaml
permissions:
  contents: read    # Read repository code only
  pages: write      # Write to GitHub Pages only
  id-token: write   # For OIDC token (required by Pages)
```

**Pinned action versions:**
- `actions/checkout@v4.2.2`
- `actions/setup-node@v4.1.0`
- `actions/upload-pages-artifact@v3.0.1`
- `actions/deploy-pages@v4.0.5`

**Build-time security checks:**
- `npm audit` runs before build
- Build output scanned for secrets

**Deployment restrictions:**
- Deploys only from `main` branch
- Manual workflow dispatch available for emergency deploys

### 6. Content Security Policy

The app includes a strict CSP via meta tag:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  script-src 'self';
  connect-src 'self';
" />
```

| Directive | Policy |
|-----------|--------|
| `default-src` | Only same-origin resources |
| `style-src` | Same-origin + inline (React CSS-in-JS) |
| `img-src` | Same-origin + data URIs (for emoji favicon) |
| `font-src` | Same-origin only (self-hosted Inter) |
| `script-src` | Same-origin only (no external scripts) |
| `connect-src` | Same-origin only (district maps and address lists are bundled) |

**Note:** `frame-ancestors` is not supported on CSP delivered via a `<meta>` tag, so it is omitted here (including it only logs a console warning). An HTTP header `Content-Security-Policy: frame-ancestors 'none'` would be required for clickjacking protection. GitHub Pages sends `X-Frame-Options` by default, which covers hosted deploys.

### 7. Referrer Policy

```html
<meta name="referrer" content="no-referrer" />
```

No referrer information is sent when users click external links.

### 8. External Link Security

All external links include:
```html
rel="noopener noreferrer"
```

This prevents:
- `window.opener` access (security)
- Referrer leakage (privacy)

### 9. Dependencies

As of the last audit:
```
npm audit
found 0 vulnerabilities
```

Dependencies are minimal:
- React 18.x (UI library)
- Vite 6.x (build tool)
- TypeScript (compile-time only)
- @fontsource/inter (self-hosted font)

## Privacy Model

### What is stored

| Data | Where | Sent to server? |
|------|-------|-----------------|
| User address | localStorage | ❌ Never |
| Device coordinates | Memory only, then discarded | ❌ Never |
| District selection | localStorage | ❌ Never |
| Candidate picks | localStorage | ❌ Never |
| Measure picks | localStorage | ❌ Never |

### What is NOT collected

- No analytics
- No tracking pixels
- No session cookies
- No user accounts
- No server-side logging

### Data clearing

Users can clear all stored data via Settings → "Clear my picks"

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly by emailing the repository owner directly. Do not open a public issue for security concerns.

## Updates

This document should be updated whenever security-relevant changes are made to the application.

Last updated: October 7, 2026
