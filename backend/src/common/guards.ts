import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { sendError } from './response.helper';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  teacherId?: string;
  studentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'school-mgmt-system-super-secure-production-jwt-token-2026-key';

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token is missing or invalid', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        teacherProfile: { select: { id: true } },
        studentProfile: { select: { id: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 'User account is inactive or not found', 401, 'UNAUTHORIZED');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      teacherId: user.teacherProfile?.id,
      studentId: user.studentProfile?.id,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired session token', 401, 'UNAUTHORIZED');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export async function verifyTeacherCanAccessClass(teacherId: string, classId: string, sectionId?: string, subjectId?: string): Promise<boolean> {
  const whereClause: any = {
    teacherId,
    classId,
    status: 'ACTIVE',
  };

  if (sectionId) {
    whereClause.sectionId = sectionId;
  }
  if (subjectId) {
    whereClause.subjectId = subjectId;
  }

  const assignment = await prisma.teacherSubjectClassAssignment.findFirst({
    where: whereClause,
  });

  return !!assignment;
}
