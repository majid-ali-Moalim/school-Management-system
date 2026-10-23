import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/reports/dashboard (Admin Dashboard Stats & Charts - Section 37)
router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId, studentId } = req.user!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (role === UserRole.ADMIN) {
      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        activeExams,
        publishedResults,
        currentYear,
        recentActivities,
        classesList,
        studentsByGender,
      ] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.teacher.count({ where: { status: 'ACTIVE' } }),
        prisma.class.count({ where: { status: 'ACTIVE' } }),
        prisma.subject.count({ where: { status: 'ACTIVE' } }),
        prisma.exam.count({ where: { status: { in: ['OPEN', 'DRAFT'] } } }),
        prisma.examResult.count({ where: { status: 'PUBLISHED' } }),
        prisma.academicYear.findFirst({ where: { isCurrent: true } }),
        prisma.auditLog.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, role: true } } },
        }),
        prisma.class.findMany({
          include: {
            _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
          },
        }),
        prisma.student.groupBy({
          by: ['gender'],
          where: { status: 'ACTIVE' },
          _count: { id: true },
        }),
      ]);

      // Today attendance
      const todayAttendance = await prisma.attendance.findMany({
        where: { date: today },
      });
      const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
      const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length;
      const lateCount = todayAttendance.filter(a => a.status === 'LATE').length;

      const enrollmentByClass = classesList.map(c => ({
        className: c.name,
        count: c._count.enrollments,
      }));

      const genderDistribution = studentsByGender.map(g => ({
        gender: g.gender,
        count: g._count.id,
      }));

      return sendSuccess(res, {
        summary: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSubjects,
          activeExams,
          publishedResults,
          currentAcademicYear: currentYear?.name || '2026/2027',
          attendanceRate: todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 96,
        },
        todayAttendance: {
          marked: todayAttendance.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
        },
        enrollmentByClass,
        genderDistribution,
        recentActivities,
      }, 'Admin dashboard metrics retrieved');
    }

    if (role === UserRole.TEACHER && teacherId) {
      // Teacher dashboard (Section 38)
      const assignments = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
        include: { class: true, section: true, subject: true },
      });

      const assignedClassIds = Array.from(new Set(assignments.map(a => a.classId)));
      const assignedSubjectIds = Array.from(new Set(assignments.map(a => a.subjectId)));

      const [assignedStudentsCount, upcomingExams, todaySchedule, announcements] = await Promise.all([
        prisma.enrollment.count({
          where: { classId: { in: assignedClassIds }, status: 'ACTIVE' },
        }),
        prisma.exam.findMany({
          where: { status: { in: ['OPEN', 'DRAFT'] } },
          take: 3,
          orderBy: { startDate: 'asc' },
        }),
        prisma.timetable.findMany({
          where: { teacherId },
          include: { class: true, section: true, subject: true },
          take: 5,
        }),
        prisma.announcement.findMany({
          where: { audience: { in: ['ALL', 'TEACHERS'] }, status: 'ACTIVE' },
          take: 4,
          orderBy: { publishDate: 'desc' },
        }),
      ]);

      return sendSuccess(res, {
        myClassesCount: assignedClassIds.length,
        mySubjectsCount: assignedSubjectIds.length,
        myStudentsCount: assignedStudentsCount,
        assignments,
        upcomingExams,
        todaySchedule,
        announcements,
      }, 'Teacher dashboard data');
    }

    if (role === UserRole.STUDENT && studentId) {
      // Student dashboard (Section 39)
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { class: true, section: true },
            take: 1,
          },
        },
      });

      const [attendances, publishedResults, upcomingExams, announcements, timetable] = await Promise.all([
        prisma.attendance.findMany({ where: { studentId } }),
        prisma.examResult.findMany({
          where: { studentId, status: 'PUBLISHED' },
          include: { exam: true, examSubject: { include: { subject: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.exam.findMany({
          where: { status: 'OPEN' },
          take: 3,
        }),
        prisma.announcement.findMany({
          where: { audience: { in: ['ALL', 'STUDENTS'] }, status: 'ACTIVE' },
          take: 4,
          orderBy: { publishDate: 'desc' },
        }),
        student?.enrollments[0]
          ? prisma.timetable.findMany({
              where: { classId: student.enrollments[0].classId },
              include: { subject: true, teacher: true },
              take: 5,
            })
          : [],
      ]);

      const totalDays = attendances.length;
      const daysPresent = attendances.filter(a => a.status === 'PRESENT').length;
      const daysAbsent = attendances.filter(a => a.status === 'ABSENT').length;
      const daysLate = attendances.filter(a => a.status === 'LATE').length;
      const attendancePercentage = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 100;

      const totalScore = publishedResults.reduce((acc, r) => acc + r.score, 0);
      const averageScore = publishedResults.length > 0 ? +(totalScore / publishedResults.length).toFixed(1) : 0;

      return sendSuccess(res, {
        student,
        currentClass: student?.enrollments[0]?.class?.name || 'Assigned Class',
        section: student?.enrollments[0]?.section?.name || '',
        attendancePercentage,
        attendanceCounts: {
          present: daysPresent,
          absent: daysAbsent,
          late: daysLate,
          total: totalDays,
        },
        averageScore,
        latestResults: publishedResults.slice(0, 5),
        upcomingExams,
        timetable,
        announcements,
      }, 'Student dashboard data');
    }

    return sendError(res, 'Invalid role', 400, 'BAD_REQUEST');
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return sendError(res, 'Failed to fetch dashboard metrics', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/reports/academic (Section 50 - Academic performance analytics)
router.get('/academic', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await prisma.examResult.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        examSubject: { include: { subject: true, class: true } },
      },
    });

    const gradeCounts: Record<string, number> = {};
    const subjectScores: Record<string, { total: number; count: number; name: string }> = {};

    for (const r of results) {
      gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;

      const subId = r.examSubject.subjectId;
      if (!subjectScores[subId]) {
        subjectScores[subId] = { total: 0, count: 0, name: r.examSubject.subject.name };
      }
      subjectScores[subId].total += r.score;
      subjectScores[subId].count += 1;
    }

    const subjectAverages = Object.values(subjectScores).map(s => ({
      subject: s.name,
      average: +(s.total / s.count).toFixed(1),
    }));

    return sendSuccess(res, {
      totalResults: results.length,
      gradeDistribution: Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count })),
      subjectAverages,
    }, 'Academic report generated');
  } catch (error: any) {
    console.error('Academic report error:', error);
    return sendError(res, 'Failed to generate academic report', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
