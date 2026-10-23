import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole, verifyTeacherCanAccessClass } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole, ResultStatus } from '@prisma/client';

const router = Router();

// Helper to determine grade and gradePoint from dynamic GradingScale
async function calculateGrade(score: number): Promise<{ grade: string; gradePoint: number; remarks: string }> {
  const scales = await prisma.gradingScale.findMany({
    orderBy: { minScore: 'desc' },
  });

  for (const scale of scales) {
    if (score >= scale.minScore && score <= scale.maxScore) {
      return {
        grade: scale.grade,
        gradePoint: scale.gradePoint,
        remarks: scale.remarks || '',
      };
    }
  }

  // Fallback if not matched
  if (score >= 90) return { grade: 'A+', gradePoint: 4.0, remarks: 'Outstanding' };
  if (score >= 80) return { grade: 'A', gradePoint: 3.7, remarks: 'Excellent' };
  if (score >= 70) return { grade: 'B', gradePoint: 3.0, remarks: 'Good' };
  if (score >= 60) return { grade: 'C', gradePoint: 2.0, remarks: 'Average' };
  if (score >= 50) return { grade: 'D', gradePoint: 1.0, remarks: 'Passing' };
  return { grade: 'F', gradePoint: 0.0, remarks: 'Fail' };
}

// GET /api/results (List / Query)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, studentId, teacherId } = req.user!;
    const examId = req.query.examId as string;
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string;
    const reqStudentId = req.query.studentId as string;

    const where: any = {};

    if (role === UserRole.STUDENT) {
      if (!studentId) return sendError(res, 'Student profile not found', 404, 'NOT_FOUND');
      where.studentId = studentId;
      where.status = ResultStatus.PUBLISHED; // Section 29: Student only sees published results
    } else if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');

      // Verify class and subject authorization if provided
      if (classId && subjectId) {
        const canAccess = await verifyTeacherCanAccessClass(teacherId, classId, undefined, subjectId);
        if (!canAccess) {
          return sendError(res, 'You do not have permission to view results for this class/subject', 403, 'FORBIDDEN');
        }
      }

      // Restrict to teacher's assignments
      const assignments = await prisma.teacherSubjectClassAssignment.findMany({
        where: { teacherId, status: 'ACTIVE' },
      });
      const allowedClassIds = Array.from(new Set(assignments.map(a => a.classId)));
      const allowedSubjectIds = Array.from(new Set(assignments.map(a => a.subjectId)));

      where.examSubject = {
        classId: classId ? classId : { in: allowedClassIds },
        subjectId: subjectId ? subjectId : { in: allowedSubjectIds },
      };
    } else if (role === UserRole.ADMIN) {
      if (reqStudentId) where.studentId = reqStudentId;
      if (classId || subjectId) {
        where.examSubject = {
          ...(classId && { classId }),
          ...(subjectId && { subjectId }),
        };
      }
    }

    if (examId) where.examId = examId;

    const results = await prisma.examResult.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        exam: true,
        examSubject: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, results, 'Results retrieved');
  } catch (error: any) {
    console.error('Get results error:', error);
    return sendError(res, 'Failed to fetch results', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/results/entry-sheet (Teacher score entry screen)
router.get('/entry-sheet', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId } = req.user!;
    const examId = req.query.examId as string;
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string;

    if (!examId || !classId || !subjectId) {
      return sendError(res, 'Exam, class, and subject are required', 400, 'VALIDATION_ERROR');
    }

    // Teacher authorization check
    if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      const canAccess = await verifyTeacherCanAccessClass(teacherId, classId, undefined, subjectId);
      if (!canAccess) {
        return sendError(res, 'You are not assigned to enter scores for this class and subject', 403, 'FORBIDDEN');
      }
    }

    // Find the exam subject
    const examSubject = await prisma.examSubject.findFirst({
      where: { examId, classId, subjectId },
      include: { exam: true, subject: true, class: true },
    });

    if (!examSubject) {
      return sendError(res, 'This subject is not registered under this exam for this class', 404, 'NOT_FOUND');
    }

    // Get enrolled students
    const enrolledStudents = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        enrollments: {
          some: { classId, status: 'ACTIVE' },
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

    // Get existing results
    const existingResults = await prisma.examResult.findMany({
      where: {
        examId,
        examSubjectId: examSubject.id,
      },
    });

    const resultMap = new Map(existingResults.map(r => [r.studentId, r]));

    const sheet = enrolledStudents.map(student => {
      const resRecord = resultMap.get(student.id);
      return {
        studentId: student.id,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        sectionName: student.enrollments[0]?.section?.name || '',
        resultId: resRecord?.id || null,
        score: resRecord?.score ?? null,
        grade: resRecord?.grade ?? '',
        gradePoint: resRecord?.gradePoint ?? 0,
        remarks: resRecord?.remarks ?? '',
        status: resRecord?.status ?? ResultStatus.DRAFT,
      };
    });

    return sendSuccess(res, {
      examSubject,
      students: sheet,
    }, 'Score entry sheet loaded');
  } catch (error: any) {
    console.error('Get entry sheet error:', error);
    return sendError(res, 'Failed to load score entry sheet', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/results/bulk (Score Registration Submission)
router.post('/bulk', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, teacherId } = req.user!;
    const { examId, examSubjectId, scores } = req.body;

    if (!examId || !examSubjectId || !Array.isArray(scores) || scores.length === 0) {
      return sendError(res, 'Exam, exam subject, and scores are required', 400, 'VALIDATION_ERROR');
    }

    const examSubject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: { exam: true, subject: true, class: true },
    });

    if (!examSubject) {
      return sendError(res, 'Exam subject not found', 404, 'NOT_FOUND');
    }

    // Teacher authorization check (Section 64)
    if (role === UserRole.TEACHER) {
      if (!teacherId) return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      const canAccess = await verifyTeacherCanAccessClass(teacherId, examSubject.classId, undefined, examSubject.subjectId);
      if (!canAccess) {
        return sendError(res, 'You are not assigned to enter scores for this class and subject', 403, 'FORBIDDEN');
      }
    } else if (role !== UserRole.ADMIN) {
      return sendError(res, 'Unauthorized to enter scores', 403, 'FORBIDDEN');
    }

    // Validate scores against maxScore
    for (const item of scores) {
      if (item.score < 0 || item.score > examSubject.maxScore) {
        return sendError(
          res,
          `Score for student cannot exceed maximum mark (${examSubject.maxScore}) or be negative`,
          400,
          'INVALID_SCORE'
        );
      }
    }

    // Perform transaction to upsert scores and calculate dynamic grades
    const saved = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of scores) {
        const { grade, gradePoint, remarks: defaultRemarks } = await calculateGrade(item.score);
        const res = await tx.examResult.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId,
              studentId: item.studentId,
            },
          },
          update: {
            score: parseFloat(item.score.toString()),
            grade,
            gradePoint,
            remarks: item.remarks || defaultRemarks,
            status: role === UserRole.ADMIN ? ResultStatus.PUBLISHED : ResultStatus.ENTERED,
            enteredBy: req.user!.id,
            ...(role === UserRole.ADMIN && { publishedAt: new Date() }),
          },
          create: {
            examId,
            examSubjectId,
            studentId: item.studentId,
            score: parseFloat(item.score.toString()),
            grade,
            gradePoint,
            remarks: item.remarks || defaultRemarks,
            status: role === UserRole.ADMIN ? ResultStatus.PUBLISHED : ResultStatus.ENTERED,
            enteredBy: req.user!.id,
            ...(role === UserRole.ADMIN && { publishedAt: new Date() }),
          },
        });
        results.push(res);
      }
      return results;
    });

    await logAudit({
      userId: req.user!.id,
      action: 'ENTER_SCORE',
      entity: 'ExamResult',
      entityId: examSubjectId,
      description: `Entered/updated scores for ${saved.length} students in ${examSubject.subject.name} (${examSubject.class.name})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { count: saved.length }, 'Scores registered successfully');
  } catch (error: any) {
    console.error('Score registration error:', error);
    return sendError(res, 'Failed to save exam scores', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/results/publish (Admin only)
router.post('/publish', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, examSubjectId } = req.body;

    const where: any = {};
    if (examId) where.examId = examId;
    if (examSubjectId) where.examSubjectId = examSubjectId;

    const updated = await prisma.examResult.updateMany({
      where,
      data: {
        status: ResultStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'PUBLISH_RESULT',
      entity: 'ExamResult',
      entityId: examId || examSubjectId,
      description: `Published ${updated.count} exam results`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { count: updated.count }, 'Results published successfully');
  } catch (error: any) {
    console.error('Publish results error:', error);
    return sendError(res, 'Failed to publish results', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/results/report-card/:studentId (Section 30 - Report Card)
router.get('/report-card/:studentId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { role, studentId: sessionStudentId } = req.user!;
    const examId = req.query.examId as string;

    if (role === UserRole.STUDENT && sessionStudentId !== studentId) {
      return sendError(res, 'You cannot access another student report card', 403, 'FORBIDDEN');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
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
    });

    if (!student) {
      return sendError(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const schoolSetting = await prisma.schoolSetting.findUnique({ where: { id: 'default' } });

    // Results query
    const resultsWhere: any = {
      studentId,
      status: ResultStatus.PUBLISHED,
    };
    if (examId) resultsWhere.examId = examId;

    const results = await prisma.examResult.findMany({
      where: resultsWhere,
      include: {
        exam: { include: { term: true, academicYear: true } },
        examSubject: { include: { subject: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attendance stats
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
    });
    const totalDays = attendances.length;
    const daysPresent = attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 100;

    // Academic averages
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const averageScore = results.length > 0 ? +(totalScore / results.length).toFixed(2) : 0;
    const totalGpa = results.reduce((acc, r) => acc + r.gradePoint, 0);
    const gpa = results.length > 0 ? +(totalGpa / results.length).toFixed(2) : 0;

    const activeEnrollment = student.enrollments[0];

    const reportCard = {
      school: {
        name: schoolSetting?.schoolName || 'School Management System',
        logoUrl: schoolSetting?.logoUrl,
        address: schoolSetting?.address,
        phone: schoolSetting?.phone,
        email: schoolSetting?.email,
      },
      student: {
        id: student.id,
        name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
        studentNumber: student.studentNumber,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
      },
      academic: {
        academicYear: activeEnrollment?.academicYear?.name || '2026/2027',
        className: activeEnrollment?.class?.name || '',
        sectionName: activeEnrollment?.section?.name || '',
      },
      attendance: {
        totalDays,
        daysPresent,
        percentage: attendancePercentage,
      },
      performance: {
        results: results.map(r => ({
          subjectCode: r.examSubject.subject.code,
          subjectName: r.examSubject.subject.name,
          maxScore: r.examSubject.maxScore,
          passScore: r.examSubject.passScore,
          score: r.score,
          grade: r.grade,
          gradePoint: r.gradePoint,
          remarks: r.remarks,
        })),
        totalSubjects: results.length,
        averageScore,
        gpa,
        overallStatus: averageScore >= 50 ? 'PASSED' : 'FAILED',
      },
      issuedDate: new Date().toISOString(),
    };

    return sendSuccess(res, reportCard, 'Report card generated successfully');
  } catch (error: any) {
    console.error('Report card error:', error);
    return sendError(res, 'Failed to generate report card', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
