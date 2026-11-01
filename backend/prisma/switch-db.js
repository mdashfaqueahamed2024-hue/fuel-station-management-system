import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = process.argv[2]?.toLowerCase() || 'sqlite';
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const targetSchema = path.join(__dirname, 'schema.prisma');

if (target === 'sqlite') {
  console.log('🔄 Switching Prisma configuration to SQLite (Local Zero-Config Dev Mode)...');
  const sqliteSchema = fs.readFileSync(path.join(__dirname, 'schema.sqlite.prisma'), 'utf-8');
  fs.writeFileSync(targetSchema, sqliteSchema);

  // Update .env with SQLite URL
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/g, 'DATABASE_URL="file:./dev.db"');
    } else {
      envContent += '\nDATABASE_URL="file:./dev.db"\n';
    }
  } else {
    envContent = 'DATABASE_URL="file:./dev.db"\nPORT=5000\nJWT_SECRET=super_secret_fuel_station_jwt_key_2026\nNODE_ENV=development\n';
  }
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Active schema: SQLite -> file:./dev.db');
} else if (target === 'pg' || target === 'postgres' || target === 'postgresql') {
  console.log('🔄 Switching Prisma configuration to PostgreSQL (University / Production Mode)...');
  // Read PostgreSQL template
  const pgSchema = fs.readFileSync(path.join(__dirname, 'schema.pg.prisma'), 'utf-8');
  fs.writeFileSync(targetSchema, pgSchema);

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/g, 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuel_station?schema=public"');
    } else {
      envContent += '\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuel_station?schema=public"\n';
    }
  } else {
    envContent = 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuel_station?schema=public"\nPORT=5000\nJWT_SECRET=super_secret_fuel_station_jwt_key_2026\nNODE_ENV=development\n';
  }
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Active schema: PostgreSQL -> postgresql://postgres:postgres@localhost:5432/fuel_station');
} else {
  console.error('Invalid target. Use "sqlite" or "pg"');
  process.exit(1);
}
