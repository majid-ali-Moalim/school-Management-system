import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Controllers
import authRouter from './auth/auth.controller';
import usersRouter from './users/users.controller';
import studentsRouter from './students/students.controller';
import teachersRouter from './teachers/teachers.controller';
import classesRouter from './classes/classes.controller';
import subjectsRouter from './subjects/subjects.controller';
import academicYearsRouter from './academic-years/academic-years.controller';
import assignmentsRouter from './assignments/assignments.controller';
import attendanceRouter from './attendance/attendance.controller';
import examsRouter from './exams/exams.controller';
import resultsRouter from './results/results.controller';
import timetableRouter from './timetable/timetable.controller';
import announcementsRouter from './announcements/announcements.controller';
import notificationsRouter from './notifications/notifications.controller';
import reportsRouter from './reports/reports.controller';
import auditRouter from './audit/audit.controller';
import settingsRouter from './settings/settings.controller';
import { sendSuccess, sendError } from './common/response.helper';

const app = express();
const PORT = process.env.PORT || 4000;

// Security and body parsers
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    service: 'School Management System API',
  }, 'Service healthy');
});

// Mount Routes (Section 51)
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/classes', classesRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/academic-years', academicYearsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/exams', examsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/settings', settingsRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
});

// Global Error Handler (Section 52)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  return sendError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred',
    err.status || 500,
    err.code || 'INTERNAL_SERVER_ERROR'
  );
});

app.listen(PORT, () => {
  console.log(`🚀 School Management Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
