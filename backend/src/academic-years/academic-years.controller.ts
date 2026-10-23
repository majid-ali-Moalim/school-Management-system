import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AcademicStatus } from '@prisma/client';

const router = Router();

// GET /api/academic-years
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        terms: { orderBy: { startDate: 'asc' } },
        _count: {
          select: { classes: true, enrollments: true, exams: true },
        },
      },
    });

    return sendSuccess(res, years, 'Academic years retrieved');
  } catch (error: any) {
    console.error('Get academic years error:', error);
    return sendError(res, 'Failed to fetch academic years', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/academic-years (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;

    if (!name || !startDate || !endDate) {
      return sendError(res, 'Name, start date, and end date are required', 400, 'VALIDATION_ERROR');
    }

    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }

    const year = await prisma.academicYear.create({
      data: {
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
        status: AcademicStatus.ACTIVE,
      },
    });

    if (isCurrent) {
      await prisma.schoolSetting.update({
        where: { id: 'default' },
        data: { currentAcademicYearId: year.id },
      });
    }

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'AcademicYear',
      entityId: year.id,
      description: `Created academic year ${year.name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, year, 'Academic year created successfully', 201);
  } catch (error: any) {
    console.error('Create academic year error:', error);
    return sendError(res, 'Failed to create academic year', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/academic-years/:id/terms (Admin only)
router.post('/:id/terms', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isCurrent } = req.body;

    if (!name || !startDate || !endDate) {
      return sendError(res, 'Name, start date, and end date are required', 400, 'VALIDATION_ERROR');
    }

    if (isCurrent) {
      await prisma.term.updateMany({
        where: { academicYearId: id },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.term.create({
      data: {
        academicYearId: id,
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
        status: AcademicStatus.ACTIVE,
      },
    });

    if (isCurrent) {
      await prisma.schoolSetting.update({
        where: { id: 'default' },
        data: { currentTermId: term.id },
      });
    }

    return sendSuccess(res, term, 'Term created successfully', 201);
  } catch (error: any) {
    console.error('Create term error:', error);
    return sendError(res, 'Failed to create term', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
