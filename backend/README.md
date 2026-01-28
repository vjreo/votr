# VOTR Backend API

Node.js/Express backend API for the VOTR application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
```bash
createdb votr
npm run db:migrate
```

4. Start the server:
```bash
npm run dev
```

## API Documentation

### Health Check
- `GET /health` - Server health check

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `POST /api/users/:id/preferences` - Update preferences
- `POST /api/users/:id/location` - Update location
- `GET /api/users/:id/gamification` - Get gamification stats
- `POST /api/users/:id/swipes` - Record swipe

### Candidates
- `GET /api/candidates` - Get candidates (query: office, location, state)
- `GET /api/candidates/:id` - Get candidate details
- `GET /api/candidates/:id/match-score` - Get match score (query: userId)
- `POST /api/candidates/:id/sources` - Add source

### Elections
- `GET /api/elections` - Get elections (query: state, district)
- `GET /api/elections/upcoming` - Get upcoming elections (query: userId)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CIVIC_API_KEY` - Google Civic Information API key
- `HUGGINGFACE_API_KEY` - Hugging Face API key (optional)
- `MEDIA_BIAS_API_KEY` - Media Bias Fact Check API key (optional)
- `ALLSIDES_API_KEY` - AllSides API key (optional)

