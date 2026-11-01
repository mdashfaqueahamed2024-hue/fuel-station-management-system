import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

export const logAudit = async ({
  stationId = null,
  userId = null,
  actorName = 'System',
  action,
  entityType,
  entityId = null,
  beforeState = null,
  afterState = null,
  ipAddress = null,
}) => {
  try {
    const entry = await prisma.auditLog.create({
      data: {
        stationId,
        userId,
        actorName,
        action,
        entityType,
        entityId,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
        ipAddress,
      },
    });
    return entry;
  } catch (error) {
    logger.error('Failed to write audit log entry', { error: error.message, action, entityType });
    // Non-blocking for primary transaction, but logged
    return null;
  }
};
