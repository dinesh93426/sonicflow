import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('4000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/sonicflow'),
  JWT_SECRET: z.string().default('super-secret-sonicflow-production-jwt-key-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  
  // Storage settings
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),
  
  // S3 settings (optional when STORAGE_PROVIDER is local)
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),

  // Spotify Web API & PKCE Configuration
  SPOTIFY_CLIENT_ID: z.string().optional().default(''),
  SPOTIFY_CLIENT_SECRET: z.string().optional().default(''),
  SPOTIFY_REDIRECT_URI: z.string().default('http://localhost:4000/auth/spotify/callback'),
});

export const env = envSchema.parse(process.env);
