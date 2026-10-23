import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, UserStatus } from '@prisma/client';

const router = Router();

// GET /api/users (Admin only)
router.get('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const role = req.query.role as UserRole;
    const search = (req.query.search as string || '').trim();
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          middleName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: { select: { id: true, studentNumber: true } },
          teacherProfile: { select: { id: true, employeeNumber: true } },
        },
      }),
    ]);

    return sendSuccess(res, users, 'Users retrieved', 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return sendError(res, 'Failed to fetch users', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/users/:id/status (Admin only)
router.patch('/:id/status', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return sendError(res, 'Valid status is required', 400, 'VALIDATION_ERROR');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: status as UserStatus },
      select: { id: true, email: true, status: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Changed status of user ${updated.email} to ${updated.status}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'User status updated');
  } catch (error: any) {
    console.error('Update user status error:', error);
    return sendError(res, 'Failed to update user status', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/users/:id/reset-password (Admin only)
router.post('/:id/reset-password', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400, 'VALIDATION_ERROR');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, email: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Reset password for user ${user.email}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Password reset successfully');
  } catch (error: any) {
    console.error('Reset password error:', error);
    return sendError(res, 'Failed to reset password', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/users/change-password (Self)
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return sendError(res, 'Invalid password parameters', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 'User not found', 404, 'NOT_FOUND');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return sendError(res, 'Current password is incorrect', 400, 'INVALID_PASSWORD');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      description: 'User changed their own password',
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error: any) {
    console.error('Change password error:', error);
    return sendError(res, 'Failed to change password', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
