import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AcademicStatus } from '@prisma/client';

const router = Router();

// GET /api/assignments
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId } = req.user!;
    const where: any = { status: 'ACTIVE' };

    if (role === UserRole.TEACHER) {
      where.teacherId = teacherId;
    } else if (role === UserRole.ADMIN) {
      if (req.query.teacherId) where.teacherId = req.query.teacherId as string;
      if (req.query.classId) where.classId = req.query.classId as string;
      if (req.query.subjectId) where.subjectId = req.query.subjectId as string;
    }

    const assignments = await prisma.teacherSubjectClassAssignment.findMany({
      where,
      include: {
        teacher: true,
        subject: true,
        class: true,
        section: true,
        academicYear: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, assignments, 'Teacher assignments retrieved');
  } catch (error: any) {
    console.error('Get assignments error:', error);
    return sendError(res, 'Failed to fetch assignments', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/assignments (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teacherId, subjectId, classId, sectionId, academicYearId, termId } = req.body;

    if (!teacherId || !subjectId || !classId || !academicYearId) {
      return sendError(res, 'Teacher, subject, class, and academic year are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.teacherSubjectClassAssignment.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        sectionId: sectionId || null,
        academicYearId,
      },
    });

    if (existing) {
      return sendError(res, 'This teacher is already assigned to this subject and class', 409, 'DUPLICATE_ASSIGNMENT');
    }

    const assignment = await prisma.teacherSubjectClassAssignment.create({
      data: {
        teacherId,
        subjectId,
        classId,
        sectionId: sectionId || null,
        academicYearId,
        termId: termId || null,
        status: AcademicStatus.ACTIVE,
      },
      include: {
        teacher: true,
        subject: true,
        class: true,
        section: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CHANGE_ASSIGNMENT',
      entity: 'TeacherSubjectClassAssignment',
      entityId: assignment.id,
      description: `Assigned teacher ${assignment.teacher.employeeNumber} to ${assignment.subject.name} for ${assignment.class.name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, assignment, 'Assignment created successfully', 201);
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return sendError(res, 'Failed to create assignment', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// DELETE /api/assignments/:id (Admin only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.teacherSubjectClassAssignment.findUnique({
      where: { id },
      include: { teacher: true, subject: true },
    });

    if (!assignment) {
      return sendError(res, 'Assignment not found', 404, 'NOT_FOUND');
    }

    await prisma.teacherSubjectClassAssignment.delete({ where: { id } });

    await logAudit({
      userId: req.user!.id,
      action: 'CHANGE_ASSIGNMENT',
      entity: 'TeacherSubjectClassAssignment',
      entityId: id,
      description: `Removed assignment for teacher ${assignment.teacher.employeeNumber}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Assignment removed successfully');
  } catch (error: any) {
    console.error('Delete assignment error:', error);
    return sendError(res, 'Failed to delete assignment', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
