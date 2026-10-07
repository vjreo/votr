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

### 2. Device-Only Address Handling

- No third-party geocoding services or APIs
- User addresses are **never sent to any server**
- District selection is done manually by the user
- Address stored only in browser `localStorage`
- No logging of user location data

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
  frame-ancestors 'none';
" />
```

| Directive | Policy |
|-----------|--------|
| `default-src` | Only same-origin resources |
| `style-src` | Same-origin + inline (React CSS-in-JS) |
| `img-src` | Same-origin + data URIs (for emoji favicon) |
| `font-src` | Same-origin only (self-hosted Inter) |
| `script-src` | Same-origin only (no external scripts) |
| `connect-src` | Same-origin only (no external API calls) |
| `frame-ancestors` | Cannot be embedded in iframes |

**Note:** `frame-ancestors` in meta tags is not supported by browsers — this must be set via HTTP header if additional frame protection is needed. For GitHub Pages, the default X-Frame-Options header provides baseline protection.

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
