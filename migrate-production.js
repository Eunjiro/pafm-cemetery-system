#!/usr/bin/env node

/**
 * Production Database Migration Helper
 * 
 * This script helps you migrate your production database on Vercel.
 * Run this locally with your production DATABASE_URL to set up tables.
 */

const { execSync } = require('child_process');

const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;

if (!productionDbUrl) {
  console.error('❌ Error: PRODUCTION_DATABASE_URL not set');
  console.log('\nUsage:');
  console.log('  PRODUCTION_DATABASE_URL="your-neon-url" node migrate-production.js');
  console.log('\nOr add it to a .env.production file and run:');
  console.log('  npx dotenv -e .env.production -- node migrate-production.js');
  process.exit(1);
}

console.log('🚀 Running production database migrations...\n');

try {
  // Run migrations
  execSync(`DATABASE_URL="${productionDbUrl}" npx prisma migrate deploy`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: productionDbUrl }
  });
  
  console.log('\n✅ Migrations completed successfully!');
  console.log('\nYour production database is now ready.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
