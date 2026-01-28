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
├── backend/         # Node.js/Express API
├── shared/          # Shared TypeScript types
└── idea.md          # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Civic Information API key
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

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - Database credentials
   - Google Civic Information API key
   - Other API keys (optional)

5. Set up the database:
```bash
# Create PostgreSQL database
createdb votr

# Run schema
psql votr < db/schema.sql
```

6. Start the server:
```bash
npm run dev
```

The API will run on `http://localhost:3000`

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies (should already be done):
```bash
npm install
```

3. Update API URL in `services/api.ts` if needed

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

## API Endpoints

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

## Tech Stack

### Backend
- Node.js/Express
- PostgreSQL
- Google Civic Information API
- ML bias detection (placeholder for integration)

### Mobile
- React Native (Expo)
- TypeScript
- React Navigation
- Expo Location
- AsyncStorage

## Development Notes

- The bias detection system is set up with placeholder functions. Integrate with actual ML services (Hugging Face, AWS Comprehend) and bias databases (Media Bias Fact Check, AllSides) for production.
- Location services require proper permissions on iOS and Android.
- Push notifications for elections are set up but need Expo notification configuration.

## License

Private project - All rights reserved

