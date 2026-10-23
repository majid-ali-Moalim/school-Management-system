import { PrismaClient, UserRole, UserStatus, Gender, StudentStatus, TeacherStatus, AcademicStatus, AttendanceStatus, ExamType, ExamStatus, ResultStatus, DayOfWeek, AnnouncementAudience } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for School Management System...');

  // Hardcoded Admin Credentials as requested:
  // Login: admin@gmail.com
  // Pass: 123321@Admin
  const initialAdminEmail = 'admin@gmail.com';
  const initialAdminPass = '123321@Admin';
  const passwordHashAdmin = await bcrypt.hash('123321@Admin', 10);
  const passwordHashTeacher = await bcrypt.hash('Teacher123!', 10);
  const passwordHashStudent = await bcrypt.hash('Student123!', 10);

  // 1. School Settings
  console.log('Creating school settings...');
  const setting = await prisma.schoolSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      schoolName: 'Apex International Academy',
      logoUrl: '/images/school-logo.svg',
      address: '124 Education Boulevard, Academic District',
      phone: '+1 (555) 234-5678',
      email: 'info@apexacademy.edu',
      website: 'https://apexacademy.edu',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      notificationSettings: {
        emailAlerts: true,
        smsAlerts: false,
        examResultNotifs: true,
        attendanceNotifs: true
      }
    }
  });

  // 2. Grading Scales
  console.log('Configuring default grading scales...');
  const gradingData = [
    { name: 'Standard Scale', minScore: 90, maxScore: 100, grade: 'A+', gradePoint: 4.0, remarks: 'Outstanding', order: 1 },
    { name: 'Standard Scale', minScore: 80, maxScore: 89.99, grade: 'A', gradePoint: 3.7, remarks: 'Excellent', order: 2 },
    { name: 'Standard Scale', minScore: 70, maxScore: 79.99, grade: 'B', gradePoint: 3.0, remarks: 'Very Good', order: 3 },
    { name: 'Standard Scale', minScore: 60, maxScore: 69.99, grade: 'C', gradePoint: 2.0, remarks: 'Satisfactory', order: 4 },
    { name: 'Standard Scale', minScore: 50, maxScore: 59.99, grade: 'D', gradePoint: 1.0, remarks: 'Pass', order: 5 },
    { name: 'Standard Scale', minScore: 0, maxScore: 49.99, grade: 'F', gradePoint: 0.0, remarks: 'Fail', order: 6 },
  ];

  for (const scale of gradingData) {
    const existing = await prisma.gradingScale.findFirst({
      where: { grade: scale.grade, name: scale.name }
    });
    if (!existing) {
      await prisma.gradingScale.create({ data: scale });
    }
  }

  // 3. Academic Year & Terms
  console.log('Creating academic years and terms...');
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026/2027' },
    update: { isCurrent: true, status: AcademicStatus.ACTIVE },
    create: {
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
      status: AcademicStatus.ACTIVE,
    }
  });

  const term1 = await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 1' } },
    update: { isCurrent: true, status: AcademicStatus.ACTIVE },
    create: {
      academicYearId: academicYear.id,
      name: 'Term 1',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      isCurrent: true,
      status: AcademicStatus.ACTIVE
    }
  });

  const term2 = await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 2' } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: 'Term 2',
      startDate: new Date('2027-01-10'),
      endDate: new Date('2027-03-25'),
      isCurrent: false,
      status: AcademicStatus.ACTIVE
    }
  });

  const term3 = await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 3' } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: 'Term 3',
      startDate: new Date('2027-04-10'),
      endDate: new Date('2027-06-30'),
      isCurrent: false,
      status: AcademicStatus.ACTIVE
    }
  });

  await prisma.schoolSetting.update({
    where: { id: 'default' },
    data: {
      currentAcademicYearId: academicYear.id,
      currentTermId: term1.id
    }
  });

  // 4. Classes & Sections
  console.log('Creating classes and sections...');
  const grade7 = await prisma.class.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Grade 7' } },
    update: {},
    create: {
      name: 'Grade 7',
      gradeLevel: 7,
      academicYearId: academicYear.id,
      capacity: 60,
      room: 'Block A - 101',
      status: AcademicStatus.ACTIVE
    }
  });

  const sec7A = await prisma.section.upsert({
    where: { classId_name: { classId: grade7.id, name: '7A' } },
    update: {},
    create: { name: '7A', classId: grade7.id, capacity: 30, room: 'Block A - 101' }
  });

  const sec7B = await prisma.section.upsert({
    where: { classId_name: { classId: grade7.id, name: '7B' } },
    update: {},
    create: { name: '7B', classId: grade7.id, capacity: 30, room: 'Block A - 102' }
  });

  const grade8 = await prisma.class.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Grade 8' } },
    update: {},
    create: {
      name: 'Grade 8',
      gradeLevel: 8,
      academicYearId: academicYear.id,
      capacity: 60,
      room: 'Block B - 201',
      status: AcademicStatus.ACTIVE
    }
  });

  const sec8A = await prisma.section.upsert({
    where: { classId_name: { classId: grade8.id, name: '8A' } },
    update: {},
    create: { name: '8A', classId: grade8.id, capacity: 30, room: 'Block B - 201' }
  });

  const sec8B = await prisma.section.upsert({
    where: { classId_name: { classId: grade8.id, name: '8B' } },
    update: {},
    create: { name: '8B', classId: grade8.id, capacity: 30, room: 'Block B - 202' }
  });

  const grade9 = await prisma.class.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Grade 9' } },
    update: {},
    create: {
      name: 'Grade 9',
      gradeLevel: 9,
      academicYearId: academicYear.id,
      capacity: 35,
      room: 'Block C - 301',
      status: AcademicStatus.ACTIVE
    }
  });

  const sec9A = await prisma.section.upsert({
    where: { classId_name: { classId: grade9.id, name: '9A' } },
    update: {},
    create: { name: '9A', classId: grade9.id, capacity: 35, room: 'Block C - 301' }
  });

  // 5. Subjects
  console.log('Creating academic subjects...');
  const subjectsData = [
    { code: 'MAT101', name: 'Mathematics', description: 'Core Mathematics & Geometry', creditHours: 4, maxScore: 100, passScore: 50 },
    { code: 'ENG101', name: 'English Language', description: 'English Grammar & Literature', creditHours: 3, maxScore: 100, passScore: 50 },
    { code: 'SCI101', name: 'General Science', description: 'Physics, Chemistry, & Biology foundations', creditHours: 4, maxScore: 100, passScore: 50 },
    { code: 'ICT101', name: 'Computer Science', description: 'Information Technology, Coding, & Digital Literacy', creditHours: 3, maxScore: 100, passScore: 50 },
    { code: 'SOM101', name: 'Somali Language', description: 'Somali Literature, Poetry, & History', creditHours: 3, maxScore: 100, passScore: 50 },
    { code: 'ARB101', name: 'Arabic Language', description: 'Arabic Grammar, Reading, & Vocabulary', creditHours: 3, maxScore: 100, passScore: 50 },
    { code: 'SOC101', name: 'Social Studies', description: 'World History, Geography, & Civics', creditHours: 2, maxScore: 100, passScore: 50 },
  ];

  const subjectsMap: Record<string, any> = {};
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s
    });
    subjectsMap[s.code] = sub;
  }

  // 6. Admin User (Section 2 & 36)
  console.log('Creating Admin account...');

  const adminUser = await prisma.user.upsert({
    where: { email: initialAdminEmail },
    update: { password: passwordHashAdmin, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: {
      email: initialAdminEmail,
      username: 'admin',
      password: passwordHashAdmin,
      role: UserRole.ADMIN,
      firstName: 'Principal',
      lastName: 'Administrator',
      phone: '+1 (555) 900-1000',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    }
  });

  // 7. Teachers
  console.log('Creating Teachers and profiles...');
  const teachersList = [
    {
      email: 'ahmed.hassan@school.local',
      username: 'ahmed.teacher',
      firstName: 'Ahmed',
      middleName: 'Ali',
      lastName: 'Hassan',
      employeeNumber: 'TCH-001',
      qualification: 'M.Sc. Mathematics & Education',
      specialization: 'Pure Mathematics',
      phone: '+1 (555) 101-2001',
      gender: Gender.MALE
    },
    {
      email: 'sarah.connor@school.local',
      firstName: 'Sarah',
      middleName: 'Jane',
      lastName: 'Connor',
      employeeNumber: 'TCH-002',
      qualification: 'M.A. English Literature',
      specialization: 'Linguistics & Creative Writing',
      phone: '+1 (555) 101-2002',
      gender: Gender.FEMALE
    },
    {
      email: 'david.miller@school.local',
      firstName: 'David',
      middleName: 'Paul',
      lastName: 'Miller',
      employeeNumber: 'TCH-003',
      qualification: 'B.Sc. Applied Sciences',
      specialization: 'Physics & Chemistry',
      phone: '+1 (555) 101-2003',
      gender: Gender.MALE
    },
    {
      email: 'fatima.ali@school.local',
      firstName: 'Fatima',
      middleName: 'Zahra',
      lastName: 'Ali',
      employeeNumber: 'TCH-004',
      qualification: 'B.Sc. Computer Science',
      specialization: 'Programming & Web Technologies',
      phone: '+1 (555) 101-2004',
      gender: Gender.FEMALE
    },
    {
      email: 'omar.farah@school.local',
      firstName: 'Omar',
      middleName: 'Hussein',
      lastName: 'Farah',
      employeeNumber: 'TCH-005',
      qualification: 'B.A. Islamic Studies & Arabic',
      specialization: 'Arabic Philology',
      phone: '+1 (555) 101-2005',
      gender: Gender.MALE
    }
  ];

  const teachersMap: Record<string, any> = {};

  for (const t of teachersList) {
    const username = (t as any).username || t.email.split('@')[0];
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { username },
      create: {
        username,
        email: t.email,
        password: passwordHashTeacher,
        role: UserRole.TEACHER,
        firstName: t.firstName,
        middleName: t.middleName,
        lastName: t.lastName,
        phone: t.phone,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        employeeNumber: t.employeeNumber,
      },
      create: {
        userId: user.id,
        employeeNumber: t.employeeNumber,
        firstName: t.firstName,
        middleName: t.middleName,
        lastName: t.lastName,
        gender: t.gender,
        phone: t.phone,
        email: t.email,
        qualification: t.qualification,
        specialization: t.specialization,
        status: TeacherStatus.ACTIVE
      }
    });

    teachersMap[t.employeeNumber] = teacher;
  }

  // 8. Teacher Assignments
  console.log('Creating Teacher Subject & Class Assignments...');
  const assignmentsData = [
    // Ahmed Hassan teaches Math to 8A & 8B
    { teacherId: teachersMap['TCH-001'].id, subjectId: subjectsMap['MAT101'].id, classId: grade8.id, sectionId: sec8A.id },
    { teacherId: teachersMap['TCH-001'].id, subjectId: subjectsMap['MAT101'].id, classId: grade8.id, sectionId: sec8B.id },
    // Sarah Connor teaches English to 8A & 8B
    { teacherId: teachersMap['TCH-002'].id, subjectId: subjectsMap['ENG101'].id, classId: grade8.id, sectionId: sec8A.id },
    { teacherId: teachersMap['TCH-002'].id, subjectId: subjectsMap['ENG101'].id, classId: grade8.id, sectionId: sec8B.id },
    // David Miller teaches Science to 8A & 7A
    { teacherId: teachersMap['TCH-003'].id, subjectId: subjectsMap['SCI101'].id, classId: grade8.id, sectionId: sec8A.id },
    { teacherId: teachersMap['TCH-003'].id, subjectId: subjectsMap['SCI101'].id, classId: grade7.id, sectionId: sec7A.id },
    // Fatima Ali teaches ICT to 8A & 9A
    { teacherId: teachersMap['TCH-004'].id, subjectId: subjectsMap['ICT101'].id, classId: grade8.id, sectionId: sec8A.id },
    { teacherId: teachersMap['TCH-004'].id, subjectId: subjectsMap['ICT101'].id, classId: grade9.id, sectionId: sec9A.id },
  ];

  for (const asg of assignmentsData) {
    const existing = await prisma.teacherSubjectClassAssignment.findFirst({
      where: {
        teacherId: asg.teacherId,
        subjectId: asg.subjectId,
        classId: asg.classId,
        sectionId: asg.sectionId,
        academicYearId: academicYear.id
      }
    });

    if (!existing) {
      await prisma.teacherSubjectClassAssignment.create({
        data: {
          teacherId: asg.teacherId,
          subjectId: asg.subjectId,
          classId: asg.classId,
          sectionId: asg.sectionId,
          academicYearId: academicYear.id,
          termId: term1.id,
          status: AcademicStatus.ACTIVE
        }
      });
    }
  }

  // 9. Students
  console.log('Creating Students, accounts, and Enrollments...');
  const studentsList = [
    {
      email: 'student@school.local',
      username: 'B20092',
      firstName: 'Alex',
      middleName: 'Tyler',
      lastName: 'Johnson',
      studentNumber: 'B20092',
      admissionNumber: 'ADM-2026-001',
      gender: Gender.MALE,
      dateOfBirth: new Date('2012-04-15'),
      phone: '+1 (555) 400-3001',
      guardianName: 'Michael Johnson',
      guardianPhone: '+1 (555) 400-3002',
      guardianEmail: 'mjohnson@example.com',
      relationship: 'Father',
      classId: grade8.id,
      sectionId: sec8A.id
    },
    {
      email: 'halima@school.local',
      firstName: 'Halima',
      middleName: 'Khadar',
      lastName: 'Aden',
      studentNumber: 'STU-2026-002',
      admissionNumber: 'ADM-2026-002',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2012-07-22'),
      phone: '+1 (555) 400-3003',
      guardianName: 'Amina Aden',
      guardianPhone: '+1 (555) 400-3004',
      guardianEmail: 'aaden@example.com',
      relationship: 'Mother',
      classId: grade8.id,
      sectionId: sec8A.id
    },
    {
      email: 'liam@school.local',
      firstName: 'Liam',
      middleName: 'Edward',
      lastName: 'Brown',
      studentNumber: 'STU-2026-003',
      admissionNumber: 'ADM-2026-003',
      gender: Gender.MALE,
      dateOfBirth: new Date('2012-02-10'),
      phone: '+1 (555) 400-3005',
      guardianName: 'Robert Brown',
      guardianPhone: '+1 (555) 400-3006',
      guardianEmail: 'rbrown@example.com',
      relationship: 'Father',
      classId: grade8.id,
      sectionId: sec8A.id
    },
    {
      email: 'emma@school.local',
      firstName: 'Emma',
      middleName: 'Grace',
      lastName: 'Davis',
      studentNumber: 'STU-2026-004',
      admissionNumber: 'ADM-2026-004',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2012-09-05'),
      phone: '+1 (555) 400-3007',
      guardianName: 'Sarah Davis',
      guardianPhone: '+1 (555) 400-3008',
      guardianEmail: 'sdavis@example.com',
      relationship: 'Mother',
      classId: grade8.id,
      sectionId: sec8B.id
    },
    {
      email: 'noah@school.local',
      firstName: 'Noah',
      middleName: 'Alexander',
      lastName: 'Wilson',
      studentNumber: 'STU-2026-005',
      admissionNumber: 'ADM-2026-005',
      gender: Gender.MALE,
      dateOfBirth: new Date('2013-05-18'),
      phone: '+1 (555) 400-3009',
      guardianName: 'James Wilson',
      guardianPhone: '+1 (555) 400-3010',
      guardianEmail: 'jwilson@example.com',
      relationship: 'Father',
      classId: grade7.id,
      sectionId: sec7A.id
    },
    {
      email: 'sophia@school.local',
      firstName: 'Sophia',
      middleName: 'Isabella',
      lastName: 'Martinez',
      studentNumber: 'STU-2026-006',
      admissionNumber: 'ADM-2026-006',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2011-11-30'),
      phone: '+1 (555) 400-3011',
      guardianName: 'Elena Martinez',
      guardianPhone: '+1 (555) 400-3012',
      guardianEmail: 'emartinez@example.com',
      relationship: 'Mother',
      classId: grade9.id,
      sectionId: sec9A.id
    }
  ];

  const studentsMap: Record<string, any> = {};

  for (const s of studentsList) {
    const username = (s as any).username || s.studentNumber;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { username },
      create: {
        username,
        email: s.email,
        password: passwordHashStudent,
        role: UserRole.STUDENT,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        phone: s.phone,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        studentNumber: s.studentNumber,
        admissionNumber: s.admissionNumber,
      },
      create: {
        userId: user.id,
        studentNumber: s.studentNumber,
        admissionNumber: s.admissionNumber,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        phone: s.phone,
        email: s.email,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianEmail: s.guardianEmail,
        relationship: s.relationship,
        status: StudentStatus.ACTIVE
      }
    });

    studentsMap[s.studentNumber] = student;

    // Enrollment
    await prisma.enrollment.upsert({
      where: {
        studentId_academicYearId: {
          studentId: student.id,
          academicYearId: academicYear.id
        }
      },
      update: {
        classId: s.classId,
        sectionId: s.sectionId
      },
      create: {
        studentId: student.id,
        academicYearId: academicYear.id,
        classId: s.classId,
        sectionId: s.sectionId,
        status: StudentStatus.ACTIVE
      }
    });
  }

  // 10. Attendance Records
  console.log('Generating realistic attendance records...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grade8AStudents = [
    studentsMap['B20092'],
    studentsMap['STU-2026-002'],
    studentsMap['STU-2026-003']
  ];

  for (let d = 0; d < 5; d++) {
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - d);

    for (let i = 0; i < grade8AStudents.length; i++) {
      const stu = grade8AStudents[i];
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let remarks: string | null = 'On time';

      if (d === 1 && i === 2) {
        status = AttendanceStatus.LATE;
        remarks = 'Arrived 15 minutes late due to traffic';
      } else if (d === 3 && i === 1) {
        status = AttendanceStatus.EXCUSED;
        remarks = 'Doctor appointment documented';
      }

      await prisma.attendance.upsert({
        where: {
          studentId_classId_date_subjectId: {
            studentId: stu.id,
            classId: grade8.id,
            date: recordDate,
            subjectId: subjectsMap['MAT101'].id
          }
        },
        update: {},
        create: {
          studentId: stu.id,
          classId: grade8.id,
          sectionId: sec8A.id,
          subjectId: subjectsMap['MAT101'].id,
          teacherId: teachersMap['TCH-001'].id,
          date: recordDate,
          status,
          remarks
        }
      });
    }
  }

  // 11. Exams & Exam Subjects
  console.log('Creating exams and exam subjects...');
  const midtermExam = await prisma.exam.create({
    data: {
      name: 'Midterm Examination 2026',
      type: ExamType.MIDTERM,
      academicYearId: academicYear.id,
      termId: term1.id,
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-18'),
      status: ExamStatus.PUBLISHED,
      description: 'Midterm comprehensive evaluations across core competencies.'
    }
  });

  const finalExam = await prisma.exam.create({
    data: {
      name: 'Final Term Examination 2026',
      type: ExamType.FINAL,
      academicYearId: academicYear.id,
      termId: term1.id,
      startDate: new Date('2026-12-05'),
      endDate: new Date('2026-12-14'),
      status: ExamStatus.OPEN,
      description: 'First term final board and institutional examinations.'
    }
  });

  // Create exam subjects for Midterm in Grade 8
  const examSubMath = await prisma.examSubject.create({
    data: {
      examId: midtermExam.id,
      subjectId: subjectsMap['MAT101'].id,
      classId: grade8.id,
      maxScore: 100,
      passScore: 50,
      examDate: new Date('2026-10-10')
    }
  });

  const examSubEng = await prisma.examSubject.create({
    data: {
      examId: midtermExam.id,
      subjectId: subjectsMap['ENG101'].id,
      classId: grade8.id,
      maxScore: 100,
      passScore: 50,
      examDate: new Date('2026-10-12')
    }
  });

  const examSubSci = await prisma.examSubject.create({
    data: {
      examId: midtermExam.id,
      subjectId: subjectsMap['SCI101'].id,
      classId: grade8.id,
      maxScore: 100,
      passScore: 50,
      examDate: new Date('2026-10-14')
    }
  });

  const examSubICT = await prisma.examSubject.create({
    data: {
      examId: midtermExam.id,
      subjectId: subjectsMap['ICT101'].id,
      classId: grade8.id,
      maxScore: 100,
      passScore: 50,
      examDate: new Date('2026-10-16')
    }
  });

  // Final exam subjects
  await prisma.examSubject.create({
    data: {
      examId: finalExam.id,
      subjectId: subjectsMap['MAT101'].id,
      classId: grade8.id,
      maxScore: 100,
      passScore: 50,
      examDate: new Date('2026-12-06')
    }
  });

  // 12. Exam Results for Midterm
  console.log('Inserting published exam results for Grade 8A students...');
  const resultsData = [
    // Alex Johnson (B20092)
    { examId: midtermExam.id, examSubjectId: examSubMath.id, studentId: studentsMap['B20092'].id, score: 94, grade: 'A+', gradePoint: 4.0, remarks: 'Superb problem-solving' },
    { examId: midtermExam.id, examSubjectId: examSubEng.id, studentId: studentsMap['B20092'].id, score: 88, grade: 'A', gradePoint: 3.7, remarks: 'Excellent essay writing' },
    { examId: midtermExam.id, examSubjectId: examSubSci.id, studentId: studentsMap['B20092'].id, score: 91, grade: 'A+', gradePoint: 4.0, remarks: 'Brilliant conceptual grasp' },
    { examId: midtermExam.id, examSubjectId: examSubICT.id, studentId: studentsMap['B20092'].id, score: 98, grade: 'A+', gradePoint: 4.0, remarks: 'Exceptional coding and logic' },

    // Halima Aden (STU-002)
    { examId: midtermExam.id, examSubjectId: examSubMath.id, studentId: studentsMap['STU-2026-002'].id, score: 86, grade: 'A', gradePoint: 3.7, remarks: 'Solid mastery' },
    { examId: midtermExam.id, examSubjectId: examSubEng.id, studentId: studentsMap['STU-2026-002'].id, score: 95, grade: 'A+', gradePoint: 4.0, remarks: 'Outstanding comprehension' },
    { examId: midtermExam.id, examSubjectId: examSubSci.id, studentId: studentsMap['STU-2026-002'].id, score: 89, grade: 'A', gradePoint: 3.7, remarks: 'Great lab experiment work' },
    { examId: midtermExam.id, examSubjectId: examSubICT.id, studentId: studentsMap['STU-2026-002'].id, score: 92, grade: 'A+', gradePoint: 4.0, remarks: 'Great algorithmic accuracy' },

    // Liam Brown (STU-003)
    { examId: midtermExam.id, examSubjectId: examSubMath.id, studentId: studentsMap['STU-2026-003'].id, score: 76, grade: 'B', gradePoint: 3.0, remarks: 'Good effort, revise geometry' },
    { examId: midtermExam.id, examSubjectId: examSubEng.id, studentId: studentsMap['STU-2026-003'].id, score: 79, grade: 'B', gradePoint: 3.0, remarks: 'Good vocabulary' },
    { examId: midtermExam.id, examSubjectId: examSubSci.id, studentId: studentsMap['STU-2026-003'].id, score: 82, grade: 'A', gradePoint: 3.7, remarks: 'Consistent participation' },
    { examId: midtermExam.id, examSubjectId: examSubICT.id, studentId: studentsMap['STU-2026-003'].id, score: 75, grade: 'B', gradePoint: 3.0, remarks: 'Sound fundamentals' },
  ];

  for (const r of resultsData) {
    await prisma.examResult.create({
      data: {
        ...r,
        status: ResultStatus.PUBLISHED,
        publishedAt: new Date('2026-10-20'),
        enteredBy: adminUser.id
      }
    });
  }

  // 13. Timetables
  console.log('Setting up weekly timetable for Grade 8A...');
  const timetableSchedule = [
    { day: DayOfWeek.MONDAY, startTime: '08:00', endTime: '09:00', subjectId: subjectsMap['MAT101'].id, teacherId: teachersMap['TCH-001'].id },
    { day: DayOfWeek.MONDAY, startTime: '09:10', endTime: '10:10', subjectId: subjectsMap['ENG101'].id, teacherId: teachersMap['TCH-002'].id },
    { day: DayOfWeek.MONDAY, startTime: '10:30', endTime: '11:30', subjectId: subjectsMap['SCI101'].id, teacherId: teachersMap['TCH-003'].id },
    { day: DayOfWeek.MONDAY, startTime: '11:40', endTime: '12:40', subjectId: subjectsMap['ICT101'].id, teacherId: teachersMap['TCH-004'].id },

    { day: DayOfWeek.TUESDAY, startTime: '08:00', endTime: '09:00', subjectId: subjectsMap['SCI101'].id, teacherId: teachersMap['TCH-003'].id },
    { day: DayOfWeek.TUESDAY, startTime: '09:10', endTime: '10:10', subjectId: subjectsMap['MAT101'].id, teacherId: teachersMap['TCH-001'].id },
    { day: DayOfWeek.TUESDAY, startTime: '10:30', endTime: '11:30', subjectId: subjectsMap['ENG101'].id, teacherId: teachersMap['TCH-002'].id },

    { day: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '09:00', subjectId: subjectsMap['ICT101'].id, teacherId: teachersMap['TCH-004'].id },
    { day: DayOfWeek.WEDNESDAY, startTime: '09:10', endTime: '10:10', subjectId: subjectsMap['MAT101'].id, teacherId: teachersMap['TCH-001'].id },
    { day: DayOfWeek.WEDNESDAY, startTime: '10:30', endTime: '11:30', subjectId: subjectsMap['ENG101'].id, teacherId: teachersMap['TCH-002'].id },

    { day: DayOfWeek.THURSDAY, startTime: '08:00', endTime: '09:00', subjectId: subjectsMap['MAT101'].id, teacherId: teachersMap['TCH-001'].id },
    { day: DayOfWeek.THURSDAY, startTime: '09:10', endTime: '10:10', subjectId: subjectsMap['SCI101'].id, teacherId: teachersMap['TCH-003'].id },
    { day: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '11:30', subjectId: subjectsMap['ICT101'].id, teacherId: teachersMap['TCH-004'].id },
  ];

  for (const t of timetableSchedule) {
    await prisma.timetable.create({
      data: {
        classId: grade8.id,
        sectionId: sec8A.id,
        subjectId: t.subjectId,
        teacherId: t.teacherId,
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
        room: 'Block B - 201',
        academicYearId: academicYear.id,
        termId: term1.id
      }
    });
  }

  // 14. Announcements
  console.log('Publishing initial announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to Academic Year 2026/2027',
        content: 'We welcome all faculty, staff, and students to the new school year. Please review orientation guidelines and timetables.',
        audience: AnnouncementAudience.ALL,
        createdById: adminUser.id
      },
      {
        title: 'Midterm Examination Results Released',
        content: 'Midterm examination scores have been finalized and published. Students can view detailed report cards on their portal.',
        audience: AnnouncementAudience.ALL,
        createdById: adminUser.id
      },
      {
        title: 'Faculty Department Meeting: Curriculum Review',
        content: 'All teachers are requested to attend the academic council meeting this Thursday at 3:00 PM in the Conference Hall.',
        audience: AnnouncementAudience.TEACHERS,
        createdById: adminUser.id
      },
      {
        title: 'Science & Robotics Exhibition Next Month',
        content: 'Grade 8 and 9 students interested in participating in the annual robotics showcase must register projects with Teacher Fatima.',
        audience: AnnouncementAudience.STUDENTS,
        createdById: adminUser.id
      }
    ]
  });

  // 15. Notifications
  console.log('Creating initial notifications...');
  const alexJohnsonUser = await prisma.user.findUnique({ where: { email: 'student@school.local' } });
  if (alexJohnsonUser) {
    await prisma.notification.createMany({
      data: [
        {
          userId: alexJohnsonUser.id,
          title: 'Exam Results Published',
          message: 'Your Midterm Examination results are now available. Your overall average is 92.75% (A+).',
          type: 'EXAM_RESULT',
          link: '/student/results'
        },
        {
          userId: alexJohnsonUser.id,
          title: 'Weekly Timetable Updated',
          message: 'Mathematics lab session has been scheduled for Wednesday 09:10 AM.',
          type: 'TIMETABLE',
          link: '/student/timetable'
        }
      ]
    });
  }

  // 16. Audit Log
  console.log('Logging initial system events...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INIT',
        entity: 'System',
        entityId: 'seed',
        description: 'Complete system initialized with academic structure and roles.',
        ipAddress: '127.0.0.1'
      },
      {
        userId: adminUser.id,
        action: 'PUBLISH_RESULT',
        entity: 'ExamResult',
        entityId: midtermExam.id,
        description: 'Published results for Midterm Examination 2026.',
        ipAddress: '127.0.0.1'
      }
    ]
  });

  console.log('✅ Seed completed successfully! All entities connected to PostgreSQL database.');
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
