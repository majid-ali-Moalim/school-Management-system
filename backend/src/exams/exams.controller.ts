import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, ExamType, ExamStatus } from '@prisma/client';

const router = Router();

// GET /api/exams
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const where: any = {};

    if (role === UserRole.STUDENT) {
      where.status = { in: [ExamStatus.OPEN, ExamStatus.PUBLISHED] };
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        academicYear: true,
        term: true,
        examSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
    });

    return sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (error: any) {
    console.error('Get exams error:', error);
    return sendError(res, 'Failed to fetch exams', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/exams/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, teacherId } = req.user!;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        academicYear: true,
        term: true,
        examSubjects: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!exam) {
      return sendError(res, 'Exam not found', 404, 'NOT_FOUND');
    }

    if (role === UserRole.STUDENT && exam.status === ExamStatus.DRAFT) {
      return sendError(res, 'Exam not yet released', 403, 'FORBIDDEN');
    }

    return sendSuccess(res, exam, 'Exam details retrieved');
  } catch (error: any) {
    console.error('Get exam details error:', error);
    return sendError(res, 'Failed to fetch exam', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/exams (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, academicYearId, termId, startDate, endDate, description } = req.body;

    if (!name || !academicYearId || !startDate || !endDate) {
      return sendError(res, 'Name, academic year, and dates are required', 400, 'VALIDATION_ERROR');
    }

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        type: (type as ExamType) || ExamType.MIDTERM,
        academicYearId,
        termId: termId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        status: ExamStatus.DRAFT,
      },
      include: { academicYear: true, term: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Exam',
      entityId: exam.id,
      description: `Created examination ${exam.name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, exam, 'Exam created successfully', 201);
  } catch (error: any) {
    console.error('Create exam error:', error);
    return sendError(res, 'Failed to create exam', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/exams/:id/subjects (Admin only)
router.post('/:id/subjects', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subjectId, classId, maxScore, passScore, examDate } = req.body;

    if (!subjectId || !classId) {
      return sendError(res, 'Subject and class are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.examSubject.findFirst({
      where: { examId: id, subjectId, classId },
    });

    if (existing) {
      return sendError(res, 'Subject is already added to this exam for this class', 409, 'DUPLICATE_EXAM_SUBJECT');
    }

    const examSubject = await prisma.examSubject.create({
      data: {
        examId: id,
        subjectId,
        classId,
        maxScore: maxScore ? parseFloat(maxScore) : 100,
        passScore: passScore ? parseFloat(passScore) : 50,
        examDate: examDate ? new Date(examDate) : null,
      },
      include: { subject: true, class: true },
    });

    return sendSuccess(res, examSubject, 'Subject added to exam', 201);
  } catch (error: any) {
    console.error('Add subject to exam error:', error);
    return sendError(res, 'Failed to add subject to exam', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/exams/:id (Admin only - update status, publish, etc.)
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, name, description, startDate, endDate } = req.body;

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(status && { status: status as ExamStatus }),
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    // If published, also publish all entered results for this exam
    if (status === ExamStatus.PUBLISHED) {
      await prisma.examResult.updateMany({
        where: { examId: id, status: { in: ['DRAFT', 'ENTERED', 'REVIEWED'] } },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      await logAudit({
        userId: req.user!.id,
        action: 'PUBLISH_RESULT',
        entity: 'Exam',
        entityId: id,
        description: `Published exam and finalized results for ${exam.name}`,
        ipAddress: req.ip,
      });
    }

    return sendSuccess(res, exam, 'Exam updated successfully');
  } catch (error: any) {
    console.error('Update exam error:', error);
    return sendError(res, 'Failed to update exam', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
