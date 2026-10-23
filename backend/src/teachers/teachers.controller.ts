import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, UserStatus, TeacherStatus, Gender } from '@prisma/client';

const router = Router();

// GET /api/teachers
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as TeacherStatus;
    const skip = (page - 1) * limit;

    // Student has no access to teacher admin records
    if (role === UserRole.STUDENT) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN');
    }

    const where: any = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, teachers] = await Promise.all([
      prisma.teacher.count({ where }),
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { employeeNumber: 'asc' },
        include: {
          user: { select: { id: true, email: true, status: true, phone: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              class: true,
              section: true,
              subject: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess(res, teachers, 'Teachers retrieved successfully', 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Get teachers error:', error);
    return sendError(res, 'Failed to fetch teachers', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/teachers/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, teacherId } = req.user!;

    if (role === UserRole.STUDENT) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN');
    }

    // Teacher can only view self unless admin
    if (role === UserRole.TEACHER && teacherId !== id) {
      return sendError(res, 'You cannot access another teacher private information', 403, 'FORBIDDEN');
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, status: true, phone: true } },
        assignments: {
          include: {
            class: true,
            section: true,
            subject: true,
            academicYear: true,
          },
        },
        timetables: {
          include: {
            class: true,
            section: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, teacher, 'Teacher details retrieved');
  } catch (error: any) {
    console.error('Get teacher details error:', error);
    return sendError(res, 'Failed to fetch teacher', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/teachers (Admin only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      gender,
      phone,
      address,
      qualification,
      specialization,
      employeeNumber,
      employmentDate,
    } = req.body;

    const rawUsername = (req.body.username || `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`).trim();
    const finalEmpNumber = (employeeNumber || `TCH-${Math.floor(100 + Math.random() * 900)}`).trim();
    const teacherEmail = email?.trim() || `${rawUsername}@school.internal`;

    if (!firstName || !lastName) {
      return sendError(res, 'First name and last name are required', 400, 'VALIDATION_ERROR');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: teacherEmail.toLowerCase() },
          { username: rawUsername },
        ],
      },
    });
    if (existingUser) {
      return sendError(res, 'A user account with this email or username already exists', 409, 'DUPLICATE_USER');
    }

    const existingEmp = await prisma.teacher.findUnique({ where: { employeeNumber: finalEmpNumber } });
    if (existingEmp) {
      return sendError(res, 'Employee number is already assigned', 409, 'DUPLICATE_EMPLOYEE_NUMBER');
    }

    // Generate secure temporary password for new teacher (Section 12 & 13)
    const rawTemporaryPassword = password || Math.random().toString(36).slice(-8) + 'T1!';
    const hashedPassword = await bcrypt.hash(rawTemporaryPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: rawUsername,
          email: teacherEmail.toLowerCase(),
          password: hashedPassword,
          role: UserRole.TEACHER,
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : null,
          lastName: lastName.trim(),
          phone: phone || null,
          status: UserStatus.ACTIVE,
          mustChangePassword: true, // Section 14: must change on first login
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeNumber: finalEmpNumber,
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : null,
          lastName: lastName.trim(),
          gender: (gender as Gender) || Gender.MALE,
          phone: phone || null,
          email: teacherEmail.toLowerCase(),
          address: address || null,
          qualification: qualification || null,
          specialization: specialization || null,
          employmentDate: employmentDate ? new Date(employmentDate) : new Date(),
          status: TeacherStatus.ACTIVE,
        },
      });

      return { user, teacher };
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_TEACHER',
      entity: 'Teacher',
      entityId: result.teacher.id,
      description: `Registered faculty member ${result.teacher.firstName} ${result.teacher.lastName} (${result.teacher.employeeNumber})`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        teacher: result.teacher,
        credentials: {
          username: rawUsername,
          temporaryPassword: rawTemporaryPassword,
          mustChangePassword: true,
        },
      },
      'Teacher account registered successfully. Temporary credentials generated.',
      201
    );
  } catch (error: any) {
    console.error('Create teacher error:', error);
    return sendError(res, 'Failed to create teacher record', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/teachers/:id/reset-password (Section 16 & 29 - Admin resets teacher password)
router.post('/:id/reset-password', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404, 'NOT_FOUND');
    }

    const temporaryPassword = Math.random().toString(36).slice(-8) + 'T7!';
    const newHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        password: newHash,
        mustChangePassword: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: teacher.id,
      description: `Admin reset password for teacher ${teacher.employeeNumber}.`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      username: teacher.user?.username || teacher.employeeNumber,
      temporaryPassword,
      mustChangePassword: true,
    }, 'Teacher password reset successfully');
  } catch (error: any) {
    console.error('Reset teacher password error:', error);
    return sendError(res, 'Failed to reset teacher password', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/teachers/:id (Admin or Teacher updating self)
router.patch('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, teacherId } = req.user!;

    if (role === UserRole.STUDENT) {
      return sendError(res, 'Access denied', 403, 'FORBIDDEN');
    }

    if (role === UserRole.TEACHER && teacherId !== id) {
      return sendError(res, 'You can only update your own profile', 403, 'FORBIDDEN');
    }

    const {
      firstName,
      middleName,
      lastName,
      phone,
      address,
      qualification,
      specialization,
      status,
    } = req.body;

    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return sendError(res, 'Teacher not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.teacher.update({
        where: { id },
        data: {
          ...(firstName && { firstName: firstName.trim() }),
          ...(middleName !== undefined && { middleName: middleName ? middleName.trim() : null }),
          ...(lastName && { lastName: lastName.trim() }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(qualification !== undefined && { qualification }),
          ...(specialization !== undefined && { specialization }),
          ...(role === UserRole.ADMIN && status && { status: status as TeacherStatus }),
        },
      });

      if (firstName || lastName) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: {
            ...(firstName && { firstName: firstName.trim() }),
            ...(lastName && { lastName: lastName.trim() }),
          },
        });
      }

      return t;
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: id,
      description: `Updated faculty record for ${teacher.employeeNumber}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Teacher updated successfully');
  } catch (error: any) {
    console.error('Update teacher error:', error);
    return sendError(res, 'Failed to update teacher', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
