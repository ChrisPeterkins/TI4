import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Validate required config
if (!config.nextAuthSecret && config.nodeEnv === 'production') {
  throw new Error('NEXTAUTH_SECRET is required in production');
}
