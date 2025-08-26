import dotenv from 'dotenv';
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Only require database URL if database is enabled
if (process.env.DATABASE_ENABLED === 'true' && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set when DATABASE_ENABLED=true. Did you forget to provision a database?",
  );
}

// Use a dummy connection string when database is disabled
const connectionString = process.env.DATABASE_URL || 'mongodb://localhost:27017/ocr_service';

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });