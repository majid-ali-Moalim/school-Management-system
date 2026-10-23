import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, DayOfWeek } from '@prisma/client';

const router = Router();

// GET /api/timetable
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const where: any = {};

    if (role === UserRole.STUDENT && studentId) {
      const activeEnrollment = await prisma.enrollment.findFirst({
        where: { studentId, status: 'ACTIVE' },
      });
      if (activeEnrollment) {
        where.classId = activeEnrollment.classId;
        if (activeEnrollment.sectionId) {
          where.OR = [
            { sectionId: activeEnrollment.sectionId },
            { sectionId: null },
          ];
        }
      }
    } else if (role === UserRole.TEACHER && teacherId) {
      if (req.query.view === 'class' && classId) {
        where.classId = classId;
        if (sectionId) where.sectionId = sectionId;
      } else {
        where.teacherId = teacherId;
      }
    } else if (role === UserRole.ADMIN) {
      if (classId) where.classId = classId;
      if (sectionId) where.sectionId = sectionId;
      if (req.query.teacherId) where.teacherId = req.query.teacherId as string;
    }

    const entries = await prisma.timetable.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        class: true,
        section: true,
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return sendSuccess(res, entries, 'Timetable schedule retrieved');
  } catch (error: any) {
    console.error('Get timetable error:', error);
    return sendError(res, 'Failed to fetch timetable', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/timetable (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, sectionId, subjectId, teacherId, day, startTime, endTime, room, academicYearId, termId } = req.body;

    if (!classId || !subjectId || !teacherId || !day || !startTime || !endTime || !academicYearId) {
      return sendError(res, 'Missing required timetable parameters', 400, 'VALIDATION_ERROR');
    }

    // Check teacher conflict
    const teacherConflict = await prisma.timetable.findFirst({
      where: {
        teacherId,
        day: day as DayOfWeek,
        startTime,
      },
    });

    if (teacherConflict) {
      return sendError(res, 'Teacher is already scheduled for another class at this time', 409, 'TEACHER_CONFLICT');
    }

    const entry = await prisma.timetable.create({
      data: {
        classId,
        sectionId: sectionId || null,
        subjectId,
        teacherId,
        day: day as DayOfWeek,
        startTime,
        endTime,
        room: room || null,
        academicYearId,
        termId: termId || null,
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
        section: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Timetable',
      entityId: entry.id,
      description: `Scheduled ${entry.subject.name} for ${entry.class.name} on ${entry.day} ${entry.startTime}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, entry, 'Timetable entry created', 201);
  } catch (error: any) {
    console.error('Create timetable entry error:', error);
    return sendError(res, 'Failed to schedule timetable entry', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// DELETE /api/timetable/:id (Admin only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    return sendSuccess(res, null, 'Timetable entry deleted');
  } catch (error: any) {
    console.error('Delete timetable entry error:', error);
    return sendError(res, 'Failed to delete timetable entry', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
