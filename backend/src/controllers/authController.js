import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { config } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../services/auditService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { station: true },
    });

    if (!user || !user.active) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        stationId: user.stationId,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    await logAudit({
      stationId: user.stationId,
      userId: user.id,
      actorName: user.fullName,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        stationId: user.stationId,
        stationName: user.station?.name || 'All Stations (Admin)',
      },
    }, 'Authentication successful.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  if (req.user) {
    await logAudit({
      stationId: req.user.stationId,
      userId: req.user.id,
      actorName: req.user.fullName,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      ipAddress: req.ip,
    });
  }
  return successResponse(res, null, 'Logged out successfully.');
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { station: true, employee: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    const { passwordHash, ...safeUser } = user;
    return successResponse(res, safeUser);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Current password does not match.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAudit({
      stationId: user.stationId,
      userId: user.id,
      actorName: user.fullName,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, null, 'Password successfully updated.');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
