import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import candidatesRoutes from './routes/candidates.js';
import usersRoutes from './routes/users.js';
import electionsRoutes from './routes/elections.js';
import authRoutes from './routes/auth.js';
import biasRoutes from './routes/bias.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/bias', biasRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`VOTR API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

