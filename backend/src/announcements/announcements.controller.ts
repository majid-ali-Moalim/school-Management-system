import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AnnouncementAudience } from '@prisma/client';

const router = Router();

// GET /api/announcements
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const where: any = { status: 'ACTIVE' };

    if (role === UserRole.STUDENT) {
      where.audience = { in: [AnnouncementAudience.ALL, AnnouncementAudience.STUDENTS] };
    } else if (role === UserRole.TEACHER) {
      where.audience = { in: [AnnouncementAudience.ALL, AnnouncementAudience.TEACHERS] };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { publishDate: 'desc' },
    });

    return sendSuccess(res, announcements, 'Announcements retrieved');
  } catch (error: any) {
    console.error('Get announcements error:', error);
    return sendError(res, 'Failed to fetch announcements', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/announcements (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, audience, expiryDate } = req.body;

    if (!title || !content) {
      return sendError(res, 'Title and content are required', 400, 'VALIDATION_ERROR');
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        audience: (audience as AnnouncementAudience) || AnnouncementAudience.ALL,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdById: req.user!.id,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Announcement',
      entityId: announcement.id,
      description: `Posted announcement "${announcement.title}" to ${announcement.audience}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, announcement, 'Announcement published', 201);
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return sendError(res, 'Failed to create announcement', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// DELETE /api/announcements/:id (Admin only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return sendSuccess(res, null, 'Announcement removed');
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return sendError(res, 'Failed to delete announcement', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
