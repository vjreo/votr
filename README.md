# VOTR - Making Democracy Sexy

VOTR is a mobile application that gamifies civic engagement by helping users discover and learn about candidates based on their issue preferences. Built with React Native and Node.js.

## Features

- **Preference-Based Matching**: Users select issues they care about, and the app matches them with candidates
- **Tinder-Style Swiping**: Swipe through candidates to discover alignment
- **ML-Powered Bias Detection**: Sources are ranked by reliability using hybrid ML analysis
- **Gamification**: Earn points, maintain streaks, and unlock badges
- **Location-Based**: Get candidates and elections specific to your area
- **Election Notifications**: Stay informed about upcoming elections

## Project Structure

```
votr/
├── mobile/          # React Native app (Expo)
│   ├── App.tsx      # Root component
│   ├── screens/     # Screen components
│   ├── components/  # Reusable components
│   ├── services/    # API services
│   ├── context/     # React context providers
│   └── utils/       # Utility functions
├── backend/         # Node.js/Express API
├── shared/          # Shared TypeScript types
└── idea.md          # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Open States API key (free; for NC legislators)
- Expo CLI (for mobile development)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp backend/.env.example backend/.env
```

4. Update `backend/.env` with your configuration (see Environment Variables section below)

5. Set up the database:
```bash
# Create PostgreSQL database
createdb votr

# Run migrations
npm run db:migrate
```

6. Start the backend server:
```bash
npm run dev
```

The API will run on `http://localhost:3000`

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API URL in `services/api.ts`:
   - For development: `http://localhost:3000/api`
   - For production: `https://api.votr.app/api`

4. Start the Expo development server:
```bash
npm start
```

5. Run on iOS or Android:
```bash
npm run ios
# or
npm run android
```

**Mobile Features:**
- Onboarding with preference selection
- Tinder-style candidate swiping
- Candidate detail views
- Gamification (points, streaks, badges)
- Location-based candidate discovery
- Bias-ranked source lists

## API Endpoints

### Health Check
- `GET /health` - Basic liveness check
- `GET /health/ready` - Readiness (includes DB connectivity)

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id/preferences` - Update user preferences
- `POST /api/users/:id/location` - Update user location
- `GET /api/users/:id/gamification` - Get gamification stats
- `POST /api/users/:id/swipes` - Record a swipe

### Candidates
- `GET /api/candidates` - Get candidates (query: office, location, state)
- `GET /api/candidates/:id` - Get candidate by ID
- `GET /api/candidates/:id/match-score` - Get match score (query: userId)
- `POST /api/candidates/:id/sources` - Add a source for a candidate

### Elections
- `GET /api/elections` - Get elections (query: state, district)
- `GET /api/elections/upcoming` - Get upcoming elections (query: userId)

## Environment Variables

The backend requires the following environment variables (see `.env.example` for template):

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `OPEN_STATES_API_KEY` - Open States API key (for NC legislators; free at openstates.org)
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 15m)
- `HUGGINGFACE_API_KEY` - Hugging Face API key (optional)
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `MEDIA_BIAS_API_KEY` - Media Bias Fact Check API key (optional)
- `ALLSIDES_API_KEY` - AllSides API key (optional)

## Tech Stack

### Backend
- Node.js/Express
- PostgreSQL
- Open States API (NC legislators)
- ML bias detection (placeholder for integration)

### Mobile
- React Native (Expo)
- TypeScript
- React Navigation
- Expo Location
- AsyncStorage

## Real Election Data (North Carolina)

To pull live candidates for NC:

1. **Get an Open States API key** (free):
   - Sign up at [Open States](https://openstates.org/accounts/signup/)
   - Go to Profile → API Key
   - Add to `backend/.env`: `OPEN_STATES_API_KEY=your-key`

2. **Seed curated candidates** (Governor, US Senate, local):
   ```bash
   cd backend && npm run db:seed && npm run db:seed:nc:force
   ```

3. **Enter your voting address** in Profile. The app uses Open States for state legislators and the DB for governor, senate, and local offices.

## Launch & Demo

- **Launch checklist**: See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)
- **Demo video**: Open `docs/demo/demo.html` in a browser for a slide-based demo, or follow [docs/DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md) to record the live app

## Development Notes

- The bias detection system supports Hugging Face, OpenAI, and media bias databases when API keys are set. Without keys, it uses the local database.
- Location services require proper permissions on iOS and Android.
- Push notifications for elections are set up but need Expo notification configuration.

## License

Private project - All rights reserved

