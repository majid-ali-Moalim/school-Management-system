import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, UserStatus, StudentStatus, Gender } from '@prisma/client';

const router = Router();

// GET /api/students
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').trim();
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const status = req.query.status as StudentStatus;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === UserRole.STUDENT) {
      if (!studentId) {
        return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');
      }
      where.id = studentId;
    } else if (role === UserRole.TEACHER) {
      if (!teacherId) {
        return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      }

      // Find all classes/sections assigned to this teacher
      const assignments = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
        select: { classId: true, sectionId: true },
      });

      if (assignments.length === 0) {
        return sendSuccess(res, [], 'No assigned students found', 200, { total: 0, page, limit, totalPages: 0 });
      }

      const assignedClassIds = Array.from(new Set(assignments.map(a => a.classId)));
      const assignedSectionIds = assignments.map(a => a.sectionId).filter(Boolean) as string[];

      // Filter students who are enrolled in assigned classes/sections
      where.enrollments = {
        some: {
          status: 'ACTIVE',
          classId: classId ? classId : { in: assignedClassIds },
          ...(sectionId ? { sectionId } : (assignedSectionIds.length > 0 ? { sectionId: { in: assignedSectionIds } } : {})),
        },
      };
    } else if (role === UserRole.ADMIN) {
      if (classId || sectionId) {
        where.enrollments = {
          some: {
            status: 'ACTIVE',
            ...(classId && { classId }),
            ...(sectionId && { sectionId }),
          },
        };
      }
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { studentNumber: 'asc' },
        include: {
          user: {
            select: { id: true, email: true, status: true, profileImage: true },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              class: true,
              section: true,
              academicYear: true,
            },
            take: 1,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, students, 'Students retrieved successfully', 200, {
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('Get students error:', error);
    return sendError(res, 'Failed to fetch students', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/students/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, studentId, teacherId } = req.user!;

    // Student can only view self
    if (role === UserRole.STUDENT && studentId !== id) {
      return sendError(res, 'You do not have permission to view other student records', 403, 'FORBIDDEN');
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, status: true, phone: true } },
        enrollments: {
          include: {
            class: true,
            section: true,
            academicYear: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
          include: {
            subject: true,
            class: true,
          },
        },
        results: {
          where: role === UserRole.STUDENT ? { status: 'PUBLISHED' } : undefined,
          include: {
            exam: true,
            examSubject: {
              include: { subject: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return sendError(res, 'Student not found', 404, 'NOT_FOUND');
    }

    // Teacher check
    if (role === UserRole.TEACHER) {
      const activeEnrollment = student.enrollments.find(e => e.status === 'ACTIVE');
      if (!activeEnrollment) {
        return sendError(res, 'You do not have access to this student', 403, 'FORBIDDEN');
      }

      const canAccess = await prisma.teacherSubjectClassAssignment.findFirst({
        where: {
          teacherId,
          classId: activeEnrollment.classId,
          status: 'ACTIVE',
        },
      });

      if (!canAccess) {
        return sendError(res, 'You do not have permission to view this student', 403, 'FORBIDDEN');
      }
    }

    return sendSuccess(res, student, 'Student details retrieved');
  } catch (error: any) {
    console.error('Get student by ID error:', error);
    return sendError(res, 'Failed to fetch student details', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/students (Admin only - Prisma Transaction)
router.post('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      gender,
      dateOfBirth,
      phone,
      address,
      guardianName,
      guardianPhone,
      guardianEmail,
      relationship,
      emergencyContact,
      fatherName,
      motherName,
      studentNumber,
      admissionNumber,
      classId,
      sectionId,
      academicYearId,
    } = req.body;

    // Determine student ID and admission number (supports auto-generation e.g. B20092)
    const finalStudentNumber = studentNumber?.trim() || `B${Math.floor(20000 + Math.random() * 80000)}`;
    const finalAdmissionNumber = admissionNumber?.trim() || `ADM-${finalStudentNumber}`;
    const studentEmail = email?.trim() || `${finalStudentNumber.toLowerCase()}@school.internal`;

    if (!firstName || !lastName || !dateOfBirth || !guardianName || !guardianPhone || !classId || !academicYearId) {
      return sendError(res, 'Missing required fields for student registration', 400, 'VALIDATION_ERROR');
    }

    // Check unique email and studentNumber
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: studentEmail.toLowerCase() },
          { username: finalStudentNumber },
        ],
      },
    });
    if (existingUser) {
      return sendError(res, 'A user account with this email or ID already exists', 409, 'DUPLICATE_USER');
    }

    const existingStudentNum = await prisma.student.findUnique({ where: { studentNumber: finalStudentNumber } });
    if (existingStudentNum) {
      return sendError(res, 'Student ID already exists', 409, 'DUPLICATE_STUDENT_NUMBER');
    }

    const existingAdmissionNum = await prisma.student.findUnique({ where: { admissionNumber: finalAdmissionNumber } });
    if (existingAdmissionNum) {
      return sendError(res, 'Admission number already exists', 409, 'DUPLICATE_ADMISSION_NUMBER');
    }

    // Generate secure temporary password for new student (Section 10 & 13)
    const rawTemporaryPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(rawTemporaryPassword, 10);

    // Section 55: Prisma Transaction for User + Student + Enrollment
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: finalStudentNumber,
          email: studentEmail.toLowerCase(),
          password: hashedPassword,
          role: UserRole.STUDENT,
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : null,
          lastName: lastName.trim(),
          phone: phone || null,
          status: UserStatus.ACTIVE,
          mustChangePassword: true, // Section 14: must change on first login
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentNumber: finalStudentNumber,
          admissionNumber: finalAdmissionNumber,
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : null,
          lastName: lastName.trim(),
          gender: (gender as Gender) || Gender.MALE,
          dateOfBirth: new Date(dateOfBirth),
          phone: phone || null,
          email: studentEmail.toLowerCase(),
          address: address || null,
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          guardianEmail: guardianEmail ? guardianEmail.trim() : null,
          relationship: relationship || 'Guardian',
          emergencyContact: emergencyContact || null,
          fatherName: fatherName || null,
          motherName: motherName || null,
          status: StudentStatus.ACTIVE,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId,
          classId,
          sectionId: sectionId || null,
          status: StudentStatus.ACTIVE,
        },
        include: {
          class: true,
          section: true,
          academicYear: true,
        },
      });

      return { user, student, enrollment };
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      entityId: result.student.id,
      description: `Registered student ${result.student.firstName} ${result.student.lastName} (${result.student.studentNumber})`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        student: result.student,
        enrollment: result.enrollment,
        credentials: {
          studentId: result.student.studentNumber,
          temporaryPassword: rawTemporaryPassword,
          mustChangePassword: true,
        },
      },
      'Student registered successfully. Temporary credentials generated.',
      201
    );
  } catch (error: any) {
    console.error('Create student error:', error);
    return sendError(res, error.message || 'Failed to create student', 500, 'TRANSACTION_FAILED');
  }
});

// POST /api/students/:id/reset-password (Section 16 & 29 - Admin resets student password)
router.post('/:id/reset-password', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return sendError(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const temporaryPassword = Math.random().toString(36).slice(-8) + 'X7!';
    const newHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: newHash,
        mustChangePassword: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Student',
      entityId: student.id,
      description: `Admin reset password for student ${student.studentNumber}.`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      studentId: student.studentNumber,
      temporaryPassword,
      mustChangePassword: true,
    }, 'Student password reset successfully');
  } catch (error: any) {
    console.error('Reset student password error:', error);
    return sendError(res, 'Failed to reset student password', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/students/:id (Admin only)
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      address,
      guardianName,
      guardianPhone,
      guardianEmail,
      relationship,
      emergencyContact,
      status,
      classId,
      sectionId,
      academicYearId,
    } = req.body;

    const existing = await prisma.student.findUnique({
      where: { id },
      include: { enrollments: { where: { status: 'ACTIVE' } } },
    });

    if (!existing) {
      return sendError(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: {
          ...(firstName && { firstName: firstName.trim() }),
          ...(middleName !== undefined && { middleName: middleName ? middleName.trim() : null }),
          ...(lastName && { lastName: lastName.trim() }),
          ...(gender && { gender: gender as Gender }),
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(guardianName && { guardianName }),
          ...(guardianPhone && { guardianPhone }),
          ...(guardianEmail !== undefined && { guardianEmail }),
          ...(relationship !== undefined && { relationship }),
          ...(emergencyContact !== undefined && { emergencyContact }),
          ...(status && { status: status as StudentStatus }),
        },
      });

      if (firstName || lastName) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(firstName && { firstName: firstName.trim() }),
            ...(lastName && { lastName: lastName.trim() }),
          },
        });
      }

      // Update enrollment if classId or sectionId passed
      if (classId || sectionId) {
        const activeEnrollment = existing.enrollments[0];
        if (activeEnrollment) {
          await tx.enrollment.update({
            where: { id: activeEnrollment.id },
            data: {
              ...(classId && { classId }),
              ...(sectionId !== undefined && { sectionId: sectionId || null }),
            },
          });
        }
      }

      return student;
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      description: `Updated student details for ${updated.studentNumber}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Student updated successfully');
  } catch (error: any) {
    console.error('Update student error:', error);
    return sendError(res, 'Failed to update student', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// DELETE /api/students/:id (Admin only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return sendError(res, 'Student not found', 404, 'NOT_FOUND');
    }

    // Set to INACTIVE or delete
    await prisma.student.update({
      where: { id },
      data: { status: StudentStatus.INACTIVE },
    });

    await prisma.user.update({
      where: { id: student.userId },
      data: { status: 'INACTIVE' },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Student',
      entityId: id,
      description: `Deactivated student ${student.studentNumber}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Student deactivated successfully');
  } catch (error: any) {
    console.error('Delete student error:', error);
    return sendError(res, 'Failed to deactivate student', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
