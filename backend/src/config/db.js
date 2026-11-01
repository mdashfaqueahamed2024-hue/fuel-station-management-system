import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

let prisma;

if (config.nodeEnv === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.__db;
}

export default prisma;
