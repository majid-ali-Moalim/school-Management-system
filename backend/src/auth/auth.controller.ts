import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, JWT_SECRET } from '../common/guards';
import { logAudit } from '../common/audit.service';

const router = Router();

// POST /api/auth/login
// Accepts identifier (email, username, or student ID) + password
router.post('/login', async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.username || req.body.studentId;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return sendError(res, 'Login identifier and password are required', 400, 'VALIDATION_ERROR');
    }

    const cleanIdentifier = String(rawIdentifier).trim();

    // Query User by email, username, student ID (studentNumber), or employee number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
          { studentProfile: { studentNumber: { equals: cleanIdentifier, mode: 'insensitive' } } },
          { teacherProfile: { employeeNumber: { equals: cleanIdentifier, mode: 'insensitive' } } },
        ],
      },
      include: {
        teacherProfile: true,
        studentProfile: {
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
        },
      },
    });

    // If user not found, return generic message without revealing if account exists (Section 25)
    if (!user) {
      return sendError(res, 'Invalid login credentials.', 401, 'INVALID_CREDENTIALS');
    }

    // Check account status (Section 24 & 25)
    if (user.status === 'INACTIVE') {
      return sendError(res, 'Your account is inactive. Please contact the administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Your account has been suspended. Please contact the administrator.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid login credentials.', 401, 'INVALID_CREDENTIALS');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email || user.username || user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      description: `User ${user.email || user.username} (${user.role}) logged in successfully.`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        token,
        mustChangePassword: user.mustChangePassword,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          phone: user.phone,
          profileImage: user.profileImage,
          mustChangePassword: user.mustChangePassword,
          teacherId: user.teacherProfile?.id,
          studentId: user.studentProfile?.id,
          studentNumber: user.studentProfile?.studentNumber,
          employeeNumber: user.teacherProfile?.employeeNumber,
          studentProfile: user.studentProfile,
          teacherProfile: user.teacherProfile,
        },
      },
      'Login successful'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return sendError(res, 'An error occurred during authentication', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/auth/change-password (Section 15 - First login and user password change)
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(res, 'Current password, new password, and confirmation are required', 400, 'VALIDATION_ERROR');
    }

    if (newPassword.length < 8) {
      return sendError(res, 'New password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 'New password and confirmation do not match', 400, 'VALIDATION_ERROR');
    }

    if (newPassword === currentPassword) {
      return sendError(res, 'New password must be different from current password', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return sendError(res, 'User account not found', 404, 'NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHash,
        mustChangePassword: false,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      description: `User ${user.email || user.username} updated their password.`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { changed: true }, 'Password changed successfully');
  } catch (error: any) {
    console.error('Change password error:', error);
    return sendError(res, 'Failed to update password', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        teacherProfile: {
          include: {
            assignments: {
              where: { status: 'ACTIVE' },
              include: {
                class: true,
                section: true,
                subject: true,
                academicYear: true,
              },
            },
          },
        },
        studentProfile: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: true,
                section: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, user, 'Current session fetched');
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return sendError(res, 'Failed to fetch user session', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user.id,
      description: `User ${req.user.email} logged out.`,
      ipAddress: req.ip,
    });
  }
  return sendSuccess(res, null, 'Logged out successfully');
});

export default router;
