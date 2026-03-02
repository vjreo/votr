# VOTR Launch Checklist

## Pre-Launch Verification

### Backend
- [ ] Run `npm run db:migrate` in `backend/`
- [ ] Set production env: `NODE_ENV=production`, strong `JWT_SECRET`
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

# Terminal 2: Mobile
cd mobile && npx expo start
# Press 'i' for iOS or 'a' for Android
```

Point mobile at backend: set `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api` in `mobile/.env` when testing on a physical device.

---

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic liveness (load balancer) |
| `GET /health/ready` | Full readiness including DB |
