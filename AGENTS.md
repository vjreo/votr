# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

VOTR is a civic engagement mobile app with three components:
- **Backend** (`backend/`): Node.js/Express API on port 3000, using PostgreSQL
- **Mobile** (`mobile/`): React Native (Expo) app, can run in web mode on port 8081
- **Shared** (`shared/`): TypeScript type definitions (workspace-level; not a runnable package)

Root `package.json` uses npm workspaces for `backend` and `mobile`.

### Prerequisites

- **PostgreSQL 16** must be installed and running (`sudo pg_ctlcluster 16 main start`)
- Database `votr` with user `votr` / password `votr_dev_password` must exist
- The `uuid-ossp` extension must be created by a superuser before running migrations
- Backend requires a `.env` file at `backend/.env` (see `.env.example` at repo root)

### Database setup caveats

- The migration script (`backend/db/migrate.js`) splits SQL by semicolons and executes each statement individually. This causes the `COALESCE`-based `UNIQUE` constraints in `candidates` and `elections` tables to fail (PostgreSQL doesn't support functional expressions in table-level UNIQUE constraints). The tables still get created without those constraints; this does not block development.
- The `uuid-ossp` extension requires superuser privileges. Run `sudo -u postgres psql -d votr -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'` before running `npm run db:migrate`.

### Running services

- **Backend**: `npm run dev` from repo root, or `npm run dev` from `backend/` (uses nodemon for hot reload)
- **Mobile web**: `cd mobile && npx expo start --web --port 8081` (requires `react-dom` and `react-native-web` installed via `npx expo install react-dom react-native-web`)
- Health check: `curl http://localhost:3000/health`

### Known issues

- The mobile app has pre-existing broken import paths (e.g., references to `../../../../shared/theme/colors` should be `../../../shared/theme/colors`). These cause TypeScript errors and Expo web bundling failures until fixed.
- External API keys (Google Civic, OpenAI, Hugging Face) are optional for local dev; endpoints that depend on them will return errors when those keys are not set.
- No ESLint config or test files exist in the repository. Jest is installed at the root level but there are no test files.

### Useful commands

See `README.md` for full API endpoint reference. Key scripts from root `package.json`:
- `npm run dev` — starts backend dev server
- `npm run db:migrate` — runs database migrations
- `npm run dev:mobile` — starts Expo dev server
