import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/audit-logs (Admin only)
router.get('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const action = req.query.action as string;
    const entity = req.query.entity as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
    ]);

    return sendSuccess(res, logs, 'Audit logs retrieved', 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return sendError(res, 'Failed to fetch audit logs', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
