import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import gameDataRoutes from './routes/gameData';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/data', gameDataRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;