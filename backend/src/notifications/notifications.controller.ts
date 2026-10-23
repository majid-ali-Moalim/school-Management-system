import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest } from '../common/guards';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return sendError(res, 'Failed to fetch notifications', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'Marked as read');
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return sendError(res, 'Failed to update notification', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'All marked as read');
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return sendError(res, 'Failed to update notifications', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
