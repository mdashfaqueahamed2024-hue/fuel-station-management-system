import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { resolveStation } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const getPumps = async (req, res) => {
  try {
    const stationId = resolveStation(req);
    const pumps = await prisma.pump.findMany({
      where: stationId ? { stationId } : {},
      include: {
        tank: {
          include: { fuelProduct: true },
        },
        meterReadings: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
        },
      },
      orderBy: { pumpNumber: 'asc' },
    });

    return successResponse(res, pumps);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const updatePumpStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pump = await prisma.pump.update({
      where: { id },
      data: { status },
      include: { tank: { include: { fuelProduct: true } } },
    });

    await logAudit({
      stationId: pump.stationId,
      userId: req.user.id,
      actorName: req.user.fullName,
      action: 'PUMP_STATUS_UPDATE',
      entityType: 'Pump',
      entityId: id,
      afterState: { status },
      ipAddress: req.ip,
    });

    return successResponse(res, pump, `Pump ${pump.pumpNumber} status set to ${status}.`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const recordManualMeterReading = async (req, res) => {
  try {
    const { pumpId, readingType, readingValue, notes } = req.body;
    const pump = await prisma.pump.findUnique({ where: { id: pumpId } });

    if (!pump) return errorResponse(res, 'Pump not found', 404);

    const val = Number(readingValue);

    // Fetch previous reading
    const lastReading = await prisma.meterReading.findFirst({
      where: { pumpId },
      orderBy: { recordedAt: 'desc' },
    });

    let differenceLiters = 0;
    if (lastReading) {
      const prevVal = Number(lastReading.readingValue);
      if (val < prevVal && readingType !== 'RESET') {
        return errorResponse(
          res,
          `Meter reading (${val}) cannot be lower than the previous recorded reading (${prevVal}) unless performing an authorized RESET.`,
          400
        );
      }
      differenceLiters = Math.max(0, val - prevVal);
    }

    const reading = await prisma.meterReading.create({
      data: {
        stationId: pump.stationId,
        pumpId,
        readingType: readingType || 'AUDIT',
        readingValue: val,
        differenceLiters,
        recordedByUserId: req.user.id,
        notes,
      },
    });

    return successResponse(res, reading, 'Meter reading successfully logged.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
