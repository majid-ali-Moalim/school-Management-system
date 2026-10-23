import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AcademicStatus } from '@prisma/client';

const router = Router();

// GET /api/subjects
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId } = req.user!;
    const where: any = {};

    if (role === UserRole.TEACHER && teacherId && req.query.assignedOnly === 'true') {
      const assignments = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
        select: { subjectId: true },
      });
      const subjectIds = Array.from(new Set(assignments.map(a => a.subjectId)));
      where.id = { in: subjectIds };
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            assignments: { where: { status: 'ACTIVE' } },
            examSubjects: true,
          },
        },
      },
    });

    return sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error: any) {
    console.error('Get subjects error:', error);
    return sendError(res, 'Failed to fetch subjects', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/subjects (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, description, creditHours, maxScore, passScore } = req.body;

    if (!code || !name) {
      return sendError(res, 'Code and name are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.subject.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return sendError(res, 'Subject code already exists', 409, 'DUPLICATE_CODE');
    }

    const subject = await prisma.subject.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description || null,
        creditHours: creditHours ? parseInt(creditHours) : 3,
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        passScore: passScore ? parseFloat(passScore) : 50,
        status: AcademicStatus.ACTIVE,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Subject',
      entityId: subject.id,
      description: `Created subject ${subject.code} - ${subject.name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error: any) {
    console.error('Create subject error:', error);
    return sendError(res, 'Failed to create subject', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/subjects/:id (Admin only)
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, creditHours, maxScore, passScore, status } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(creditHours !== undefined && { creditHours: parseInt(creditHours) }),
        ...(maxScore !== undefined && { maxScore: parseFloat(maxScore) }),
        ...(passScore !== undefined && { passScore: parseFloat(passScore) }),
        ...(status && { status: status as AcademicStatus }),
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Subject',
      entityId: id,
      description: `Updated subject ${subject.code}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error: any) {
    console.error('Update subject error:', error);
    return sendError(res, 'Failed to update subject', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
