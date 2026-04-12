# VOTR Launch Guide

A step-by-step guide to launch VOTR from development to production. Use this as your primary reference when preparing to ship.

---

## 1. Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local or hosted)
- **Expo CLI** (`npm install -g expo-cli` or use `npx expo`)
- **GitHub** account (for deployment)
- **Render** account (backend hosting)
- **Expo/EAS** account (mobile builds, optional for dev)

---

## 2. Local Setup

### 2.1 Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values (see below)
npm install
npm run db:migrate
npm run db:seed
npm run db:seed:nc:force   # Load NC candidates (governor, senate, local)
npm start
```

**Required `.env` variables:**

| Variable | Required | How to get |
|----------|----------|------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | Local PostgreSQL or use `DATABASE_URL` |
| `JWT_SECRET` | Yes | `openssl rand -hex 32` |
| `OPEN_STATES_API_KEY` | **Required for NC** | [Open States](https://openstates.org/accounts/signup/) → Profile → API Key (free) |

Without `OPEN_STATES_API_KEY`, NC state legislators won’t load from Open States; curated Governor, Senate, and local candidates will still appear.

### 2.2 Mobile

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api for physical device testing
npm install
npx expo start
# Press 'i' for iOS simulator, 'a' for Android
```

### 2.3 Verify

- Backend: `curl http://localhost:3000/health` → `{"status":"ok"}`
- Backend: `curl http://localhost:3000/health/ready` → `{"status":"ready","database":"connected"}`
- Mobile: Enter NC address (e.g. `525 N Tryon St, Charlotte, NC 28202`) and confirm candidates load.

---

## 3. API Keys

### Open States API (NC legislators)

1. Sign up at [Open States](https://openstates.org/accounts/signup/)
2. Go to Profile → API Key
3. Copy key and add to `backend/.env` as `OPEN_STATES_API_KEY`

---

## 4. Production Deployment

### 4.1 Backend (Render)

1. Push code to GitHub
2. [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect the `votr` repo
4. Render will detect `render.yaml` and create:
   - Web service: `votr-api`
   - PostgreSQL: `votr-db`
5. In **votr-api** → Environment, add `OPEN_STATES_API_KEY` (required for NC legislators)
6. Deploy; migrations run automatically

**Post-deploy**

- API URL: `https://votr-api-XXXX.onrender.com`
- Health: `https://votr-api-XXXX.onrender.com/health`
- Ready: `https://votr-api-XXXX.onrender.com/health/ready`

### 4.2 Seed Production DB

After first deploy, seed NC candidates:

```bash
# Set DATABASE_URL to your Render PostgreSQL connection string
cd backend
DATABASE_URL="postgresql://..." npm run db:seed
DATABASE_URL="postgresql://..." npm run db:seed:nc:force
```

Or run these via Render shell if available.

### 4.3 Mobile (EAS Build)

```bash
cd mobile
echo "EXPO_PUBLIC_API_URL=https://votr-api-XXXX.onrender.com/api" > .env
npx eas build --platform all
```

Requires an [Expo](https://expo.dev) account and `eas-cli` (`npm i -g eas-cli`).

---

## 5. App Store Submission

### 5.1 Assets

- **App icon**: 1024×1024 PNG
- **Screenshots**: Per device sizes (see [App Store Connect](https://appstoreconnect.apple.com))
- **Privacy policy URL**: Required for App Store and Play Store

### 5.2 Metadata

- App name, description, keywords
- Support URL
- Category (e.g. News or Reference)

### 5.3 Checklist

- [ ] Splash and first-run flow tested
- [ ] Address entry and onboarding tested
- [ ] Candidates load for NC (with address)
- [ ] Sample ballot and election calendar work
- [ ] Profile, Roster, Journey screens work
- [ ] Backend health checks pass
- [ ] Production `JWT_SECRET` is strong and unique
- [ ] No API keys in client code

---

## 6. Data Sources (NC)

| Source | What it provides |
|-------|------------------|
| **Open States** | NC state legislators (Senate + House) – live |
| **Curated DB** | Governor, US Senate, Charlotte Mayor – seeded |


See [CANDIDATE_AND_BALLOT_DATA.md](./CANDIDATE_AND_BALLOT_DATA.md) for details.

---

## 7. Troubleshooting

### No candidates for NC

1. Ensure `OPEN_STATES_API_KEY` is set
2. Run `npm run db:seed:nc:force` in backend
3. Add a voting address in Profile (NC)
4. Check backend logs for Open States API errors

### Mobile can’t reach backend

- Simulator: use `http://localhost:3000/api`
- Physical device: use `http://YOUR_COMPUTER_IP:3000/api` (same Wi‑Fi)
- Production: use `https://votr-api-XXXX.onrender.com/api`

### Health check fails

- Verify PostgreSQL is running and reachable
- Check `DATABASE_URL` or `DB_*` variables
- Run `npm run db:migrate` manually

---

## 8. Quick Reference

| Task | Command |
|------|---------|
| Backend start | `cd backend && npm start` |
| Migrate DB | `cd backend && npm run db:migrate` |
| Seed issues/users | `cd backend && npm run db:seed` |
| Seed NC candidates | `cd backend && npm run db:seed:nc:force` |
| Seed 2026 elections | `cd backend && npm run db:seed:elections` |
| Mobile start | `cd mobile && npx expo start` |
| iOS simulator | `npx expo start --ios` |
| Android emulator | `npx expo start --android` |
| Production build | `cd mobile && npx eas build --platform all` |

---

## 9. Related Docs

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) – Pre-launch verification
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Render and EAS details
- [CANDIDATE_AND_BALLOT_DATA.md](./CANDIDATE_AND_BALLOT_DATA.md) – Data sources
- [VOTR_LAUNCH_ASSESSMENT.md](./VOTR_LAUNCH_ASSESSMENT.md) – Design and roadmap
