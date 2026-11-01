import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAllStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      where: req.user.role === 'ADMIN' ? {} : { id: req.user.stationId },
      include: {
        _count: {
          select: {
            pumps: true,
            tanks: true,
            employees: true,
          },
        },
      },
    });
    return successResponse(res, stations);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const getStationById = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        fuels: true,
        tanks: { include: { fuelProduct: true } },
        pumps: { include: { tank: true } },
      },
    });

    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    return successResponse(res, station);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
