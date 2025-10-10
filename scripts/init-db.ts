import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { initializeDatabase } from '../src/lib/db';

async function init() {
  try {
    console.log('🔄 Initializing database...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

init();