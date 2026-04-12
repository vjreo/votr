# VOTR Launch Checklist

For full instructions, see **[LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md)**.

## Pre-Launch Verification

### Backend
- [ ] Run `npm run db:migrate` in `backend/`
- [ ] Run `npm run db:seed` in `backend/` (issues, test users)
- [ ] Run `npm run db:seed:nc` in `backend/` (real NC candidates; use `--force` to replace)
- [ ] Run `npm run db:seed:elections` in `backend/` (2026 NC elections)
- [ ] Set production env: `NODE_ENV=production`, strong `JWT_SECRET`
- [ ] Add `OPEN_STATES_API_KEY` for NC legislators (required; free at openstates.org)
- [ ] Verify `/health` returns `{"status":"ok"}`
- [ ] Verify `/health/ready` returns `{"status":"ready","database":"connected"}` when DB is up

### Mobile
- [ ] Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your production API URL
- [ ] Test on iOS simulator: `cd mobile && npx expo start --ios`
- [ ] Test on Android emulator (optional): `npx expo start --android`
- [ ] For production build: `npx eas build` (requires EAS account)

### App Store
- [ ] Screenshots for required device sizes (see App Store Connect)
- [ ] App description, keywords, privacy policy URL
- [ ] App icon (1024x1024)

---

## Quick Start (Local Demo)

```bash
# Terminal 1: Backend
cd backend && npm start

# Seed data (run once). Use db:seed:nc:force to load real NC candidates.
cd backend && npm run db:seed
cd backend && npm run db:seed:nc:force

# Terminal 2: Mobile
cd mobile && npx expo start
# Press 'i' for iOS or 'a' for Android
```

The app defaults to **NC** (North Carolina). Enter an NC address (e.g. 525 N Tryon St, Charlotte, NC 28202) to see your ballot.

Point mobile at backend: set `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api` in `mobile/.env` when testing on a physical device.

---

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic liveness (load balancer) |
| `GET /health/ready` | Full readiness including DB |
