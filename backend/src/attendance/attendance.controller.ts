import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole, verifyTeacherCanAccessClass } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, AttendanceStatus } from '@prisma/client';

const router = Router();

// GET /api/attendance/summary (Dashboard statistics)
router.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (role === UserRole.STUDENT) {
      if (!studentId) return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');

      const attendances = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
      });

      const total = attendances.length;
      const present = attendances.filter(a => a.status === 'PRESENT').length;
      const absent = attendances.filter(a => a.status === 'ABSENT').length;
      const late = attendances.filter(a => a.status === 'LATE').length;
      const excused = attendances.filter(a => a.status === 'EXCUSED').length;
      const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

      return sendSuccess(res, {
        total,
        present,
        absent,
        late,
        excused,
        percentage,
        recent: attendances.slice(0, 10),
      }, 'Student attendance summary retrieved');
    }

    if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');

      const assignments = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
        select: { classId: true, sectionId: true },
      });
      const classIds = Array.from(new Set(assignments.map(a => a.classId)));

      const todayRecords = await prisma.attendance.findMany({
        where: {
          classId: { in: classIds },
          date: today,
        },
      });

      const total = todayRecords.length;
      const present = todayRecords.filter(a => a.status === 'PRESENT').length;
      const absent = todayRecords.filter(a => a.status === 'ABSENT').length;
      const late = todayRecords.filter(a => a.status === 'LATE').length;
      const excused = todayRecords.filter(a => a.status === 'EXCUSED').length;

      return sendSuccess(res, {
        todayTotal: total,
        present,
        absent,
        late,
        excused,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      }, 'Teacher attendance summary');
    }

    // ADMIN Summary
    const todayRecords = await prisma.attendance.findMany({
      where: { date: today },
    });

    const totalStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const marked = todayRecords.length;
    const present = todayRecords.filter(a => a.status === 'PRESENT').length;
    const absent = todayRecords.filter(a => a.status === 'ABSENT').length;
    const late = todayRecords.filter(a => a.status === 'LATE').length;
    const excused = todayRecords.filter(a => a.status === 'EXCUSED').length;
    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0;

    return sendSuccess(res, {
      totalStudents,
      markedToday: marked,
      present,
      absent,
      late,
      excused,
      percentage,
    }, 'Admin attendance summary');
  } catch (error: any) {
    console.error('Attendance summary error:', error);
    return sendError(res, 'Failed to fetch attendance summary', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/attendance (List / Sheet for a specific class, section, date)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const subjectId = req.query.subjectId as string;
    const dateStr = req.query.date as string;

    if (role === UserRole.STUDENT) {
      const records = await prisma.attendance.findMany({
        where: { studentId },
        include: { class: true, subject: true },
        orderBy: { date: 'desc' },
      });
      return sendSuccess(res, records, 'Student attendance records');
    }

    if (!classId) {
      return sendError(res, 'Class ID is required', 400, 'VALIDATION_ERROR');
    }

    // Teacher assignment authorization check
    if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      const canAccess = await verifyTeacherCanAccessClass(teacherId, classId, sectionId, subjectId);
      if (!canAccess) {
        return sendError(res, 'You are not authorized to access attendance for this class', 403, 'FORBIDDEN');
      }
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get students in this class/section
    const enrolledStudents = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        enrollments: {
          some: {
            classId,
            ...(sectionId && { sectionId }),
            status: 'ACTIVE',
          },
        },
      },
      include: {
        enrollments: {
          where: { classId, status: 'ACTIVE' },
          include: { section: true },
        },
      },
      orderBy: { studentNumber: 'asc' },
    });

    // Get existing attendance for this date
    const existingRecords = await prisma.attendance.findMany({
      where: {
        classId,
        ...(sectionId && { sectionId }),
        ...(subjectId && { subjectId }),
        date: targetDate,
      },
    });

    const recordsMap = new Map(existingRecords.map(r => [r.studentId, r]));

    const sheet = enrolledStudents.map(student => {
      const record = recordsMap.get(student.id);
      return {
        studentId: student.id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        sectionName: student.enrollments[0]?.section?.name || 'Main',
        attendanceId: record?.id || null,
        status: record?.status || AttendanceStatus.PRESENT,
        remarks: record?.remarks || '',
      };
    });

    return sendSuccess(res, {
      date: targetDate,
      classId,
      sectionId,
      subjectId,
      students: sheet,
    }, 'Attendance sheet loaded');
  } catch (error: any) {
    console.error('Get attendance sheet error:', error);
    return sendError(res, 'Failed to fetch attendance sheet', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/attendance/bulk (Teacher or Admin saves daily attendance sheet)
router.post('/bulk', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId } = req.user!;
    const { classId, sectionId, subjectId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return sendError(res, 'Class ID, date, and attendance records are required', 400, 'VALIDATION_ERROR');
    }

    let recorderTeacherId = teacherId;

    if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      const canAccess = await verifyTeacherCanAccessClass(teacherId, classId, sectionId, subjectId);
      if (!canAccess) {
        return sendError(res, 'You are not assigned to take attendance for this class/subject', 403, 'FORBIDDEN');
      }
    } else if (role === UserRole.ADMIN) {
      if (!recorderTeacherId) {
        // Use first teacher assigned or fallback teacher
        const firstAssignment = await prisma.teacherSubjectClassAssignment.findFirst({
          where: { classId },
        });
        if (firstAssignment) {
          recorderTeacherId = firstAssignment.teacherId;
        } else {
          const anyTeacher = await prisma.teacher.findFirst();
          if (anyTeacher) recorderTeacherId = anyTeacher.id;
        }
      }
    } else {
      return sendError(res, 'Students cannot record attendance', 403, 'FORBIDDEN');
    }

    if (!recorderTeacherId) {
      return sendError(res, 'No assigned teacher available to attribute attendance to', 400, 'NO_TEACHER');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const upsertPromises = records.map((r: { studentId: string; status: AttendanceStatus; remarks?: string }) => {
      return prisma.attendance.upsert({
        where: {
          studentId_classId_date_subjectId: {
            studentId: r.studentId,
            classId,
            date: attendanceDate,
            subjectId: subjectId || null,
          },
        },
        update: {
          status: r.status,
          remarks: r.remarks || null,
          sectionId: sectionId || null,
          teacherId: recorderTeacherId!,
        },
        create: {
          studentId: r.studentId,
          classId,
          sectionId: sectionId || null,
          subjectId: subjectId || null,
          teacherId: recorderTeacherId!,
          date: attendanceDate,
          status: r.status,
          remarks: r.remarks || null,
        },
      });
    });

    const saved = await prisma.$transaction(upsertPromises);

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_ATTENDANCE',
      entity: 'Attendance',
      entityId: classId,
      description: `Recorded attendance for ${saved.length} students on ${date}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { count: saved.length }, 'Attendance saved successfully');
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return sendError(res, 'Failed to save attendance records', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
