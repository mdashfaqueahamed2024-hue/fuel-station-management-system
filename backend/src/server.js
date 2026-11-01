import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import prisma from './config/db.js';

const startServer = async () => {
  try {
    // Verify DB connectivity
    await prisma.$connect();
    logger.info('Database connected successfully.');

    app.listen(config.port, () => {
      logger.info(`⛽ PetroFlow Server listening on http://localhost:${config.port}`);
      logger.info(`📖 Interactive API Documentation: http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
