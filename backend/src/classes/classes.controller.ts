import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AcademicStatus } from '@prisma/client';

const router = Router();

// GET /api/classes
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const where: any = {};

    if (role === UserRole.STUDENT && studentId) {
      const activeEnrollment = await prisma.enrollment.findFirst({
        where: { studentId, status: 'ACTIVE' },
      });
      if (activeEnrollment) {
        where.id = activeEnrollment.classId;
      }
    } else if (role === UserRole.TEACHER && teacherId) {
      const assigned = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
        select: { classId: true },
      });
      const assignedIds = Array.from(new Set(assigned.map(a => a.classId)));
      if (req.query.assignedOnly === 'true') {
        where.id = { in: assignedIds };
      }
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: { gradeLevel: 'asc' },
      include: {
        academicYear: true,
        sections: {
          include: {
            _count: {
              select: { enrollments: { where: { status: 'ACTIVE' } } },
            },
          },
        },
        _count: {
          select: {
            enrollments: { where: { status: 'ACTIVE' } },
            assignments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    return sendSuccess(res, classes, 'Classes retrieved successfully');
  } catch (error: any) {
    console.error('Get classes error:', error);
    return sendError(res, 'Failed to fetch classes', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/classes/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, teacherId } = req.user!;

    if (role === UserRole.TEACHER && teacherId) {
      const isAssigned = await prisma.teacherSubjectClassAssignment.findFirst({
        where: { teacherId, classId: id, status: 'ACTIVE' },
      });
      if (!isAssigned) {
        return sendError(res, 'You are not assigned to this class', 403, 'FORBIDDEN');
      }
    }

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        sections: true,
        assignments: {
          include: {
            teacher: true,
            subject: true,
            section: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            section: true,
          },
        },
      },
    });

    if (!classData) {
      return sendError(res, 'Class not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, classData, 'Class details retrieved');
  } catch (error: any) {
    console.error('Get class details error:', error);
    return sendError(res, 'Failed to fetch class', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/classes (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, gradeLevel, academicYearId, capacity, room } = req.body;

    if (!name || gradeLevel === undefined || !academicYearId) {
      return sendError(res, 'Name, grade level, and academic year are required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.class.findFirst({
      where: { academicYearId, name: name.trim() },
    });

    if (existing) {
      return sendError(res, 'A class with this name already exists in the academic year', 409, 'DUPLICATE_CLASS');
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        gradeLevel: parseInt(gradeLevel),
        academicYearId,
        capacity: capacity ? parseInt(capacity) : 40,
        room: room || null,
        status: AcademicStatus.ACTIVE,
      },
      include: { sections: true, academicYear: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Class',
      entityId: newClass.id,
      description: `Created class ${newClass.name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, newClass, 'Class created successfully', 201);
  } catch (error: any) {
    console.error('Create class error:', error);
    return sendError(res, 'Failed to create class', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/classes/:id/sections (Admin only)
router.post('/:id/sections', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, room } = req.body;

    if (!name) {
      return sendError(res, 'Section name is required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.section.findFirst({
      where: { classId: id, name: name.trim() },
    });

    if (existing) {
      return sendError(res, 'A section with this name already exists in this class', 409, 'DUPLICATE_SECTION');
    }

    const section = await prisma.section.create({
      data: {
        classId: id,
        name: name.trim(),
        capacity: capacity ? parseInt(capacity) : 40,
        room: room || null,
      },
    });

    return sendSuccess(res, section, 'Section created successfully', 201);
  } catch (error: any) {
    console.error('Create section error:', error);
    return sendError(res, 'Failed to create section', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
