import { Router, Response } from 'express';
import { prisma } from '../common/prisma';
import { sendSuccess, sendError } from '../common/response.helper';
import { authenticate, AuthenticatedRequest, requireRole } from '../common/guards';
import { logAudit } from '../common/audit.service';
import { UserRole } from '@prisma/client';

const router = Router();

// GET /api/settings (Public / Authenticated)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.schoolSetting.findUnique({
      where: { id: 'default' },
    });

    const gradingScales = await prisma.gradingScale.findMany({
      orderBy: { order: 'asc' },
    });

    return sendSuccess(res, { settings, gradingScales }, 'School settings loaded');
  } catch (error: any) {
    console.error('Get settings error:', error);
    return sendError(res, 'Failed to fetch settings', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// PATCH /api/settings (Admin only)
router.patch('/', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      schoolName,
      logoUrl,
      address,
      phone,
      email,
      website,
      currentAcademicYearId,
      currentTermId,
      timezone,
      dateFormat,
      notificationSettings,
    } = req.body;

    const updated = await prisma.schoolSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(schoolName && { schoolName: schoolName.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address && { address }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(website && { website }),
        ...(currentAcademicYearId && { currentAcademicYearId }),
        ...(currentTermId && { currentTermId }),
        ...(timezone && { timezone }),
        ...(dateFormat && { dateFormat }),
        ...(notificationSettings && { notificationSettings }),
      },
      create: {
        id: 'default',
        schoolName: schoolName || 'Apex International Academy',
        logoUrl,
        address: address || '124 Education Boulevard',
        phone: phone || '+1 (555) 234-5678',
        email: email || 'info@apexacademy.edu',
        website: website || 'https://apexacademy.edu',
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'SchoolSetting',
      entityId: 'default',
      description: 'Updated school administration and academic settings',
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'School settings saved');
  } catch (error: any) {
    console.error('Update settings error:', error);
    return sendError(res, 'Failed to update settings', 500, 'INTERNAL_SERVER_ERROR');
  }
});

// POST /api/settings/grading-scales (Admin only - Update grading scales)
router.post('/grading-scales', authenticate, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scales } = req.body;

    if (!Array.isArray(scales) || scales.length === 0) {
      return sendError(res, 'Scales array is required', 400, 'VALIDATION_ERROR');
    }

    // Replace scales with updated definitions
    await prisma.gradingScale.deleteMany({});

    const created = await prisma.gradingScale.createMany({
      data: scales.map((s, idx) => ({
        name: s.name || 'Standard Scale',
        minScore: parseFloat(s.minScore),
        maxScore: parseFloat(s.maxScore),
        grade: s.grade.trim(),
        gradePoint: parseFloat(s.gradePoint),
        remarks: s.remarks || null,
        order: idx + 1,
      })),
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'GradingScale',
      entityId: 'global',
      description: `Updated grading scale configuration (${created.count} grade tiers)`,
      ipAddress: req.ip,
    });

    const updatedScales = await prisma.gradingScale.findMany({ orderBy: { order: 'asc' } });
    return sendSuccess(res, updatedScales, 'Grading scales saved');
  } catch (error: any) {
    console.error('Save grading scales error:', error);
    return sendError(res, 'Failed to update grading scales', 500, 'INTERNAL_SERVER_ERROR');
  }
});

export default router;
