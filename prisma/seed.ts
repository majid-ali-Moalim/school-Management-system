import { PrismaClient, UserRole, UserStatus, Gender, StudentStatus, TeacherStatus, AcademicStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing clean production database with authentic role accounts...');

  // 1. Clean out previous demo/mock data
  console.log('🧹 Purging any previous demo data (exams, results, attendance, announcements, notifications)...');
  await prisma.examResult.deleteMany({});
  await prisma.examSubject.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.timetable.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.teacherSubjectClassAssignment.deleteMany({});
  await prisma.enrollment.deleteMany({});

  // Clean out non-role demo students & teachers
  await prisma.student.deleteMany({
    where: {
      studentNumber: { not: 'B20092' }
    }
  });
  await prisma.teacher.deleteMany({
    where: {
      employeeNumber: { not: 'TCH-001' }
    }
  });
  await prisma.user.deleteMany({
    where: {
      AND: [
        { email: { not: 'admin@gmail.com' } },
        { username: { notIn: ['admin', 'ahmed.teacher', 'B20092'] } }
      ]
    }
  });

  // 2. School Settings (Institutional School Management System)
  console.log('Configuring School Management System settings...');
  const setting = await prisma.schoolSetting.upsert({
    where: { id: 'default' },
    update: {
      schoolName: 'School Management System',
      address: '124 Education Boulevard, Academic District',
      phone: '+1 (555) 234-5678',
      email: 'info@school.local',
      website: 'https://school.local',
    },
    create: {
      id: 'default',
      schoolName: 'School Management System',
      logoUrl: '/images/school-logo.svg',
      address: '124 Education Boulevard, Academic District',
      phone: '+1 (555) 234-5678',
      email: 'info@school.local',
      website: 'https://school.local',
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

  // 3. Grading Scales
  console.log('Configuring standard institutional grading scales...');
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

  // 4. Academic Year & Current Term
  console.log('Configuring academic calendar...');
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

  await prisma.schoolSetting.update({
    where: { id: 'default' },
    data: {
      currentAcademicYearId: academicYear.id,
      currentTermId: term1.id
    }
  });

  // 5. Classes & Sections
  console.log('Configuring base classroom structures...');
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

  // 6. Core Subjects
  console.log('Configuring core subjects...');
  const mathSubject = await prisma.subject.upsert({
    where: { code: 'MAT101' },
    update: {},
    create: {
      code: 'MAT101',
      name: 'Mathematics',
      description: 'Algebra, Geometry, and Numeracy',
      creditHours: 3,
      maxScore: 100,
      passScore: 50
    }
  });

  const engSubject = await prisma.subject.upsert({
    where: { code: 'ENG101' },
    update: {},
    create: {
      code: 'ENG101',
      name: 'English Language',
      description: 'Grammar, Literature, and Writing',
      creditHours: 3,
      maxScore: 100,
      passScore: 50
    }
  });

  // 7. Role Account: ADMIN (admin@gmail.com / 123321@Admin)
  console.log('Configuring ADMIN account (admin@gmail.com)...');
  const passwordHashAdmin = await bcrypt.hash('123321@Admin', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: passwordHashAdmin,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    },
    create: {
      email: 'admin@gmail.com',
      username: 'admin',
      password: passwordHashAdmin,
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1 (555) 900-1000',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    }
  });

  // 8. Role Account: TEACHER (ahmed.teacher / Teacher123!)
  console.log('Configuring TEACHER account (ahmed.teacher)...');
  const passwordHashTeacher = await bcrypt.hash('Teacher123!', 10);
  
  let teacherUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'ahmed.teacher' },
        { email: 'ahmed.teacher@school.local' },
        { email: 'ahmed.hassan@school.local' }
      ]
    }
  });

  if (teacherUser) {
    teacherUser = await prisma.user.update({
      where: { id: teacherUser.id },
      data: {
        username: 'ahmed.teacher',
        email: 'ahmed.teacher@school.local',
        password: passwordHashTeacher,
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });
  } else {
    teacherUser = await prisma.user.create({
      data: {
        username: 'ahmed.teacher',
        email: 'ahmed.teacher@school.local',
        password: passwordHashTeacher,
        role: UserRole.TEACHER,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        phone: '+1 (555) 101-2001',
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });
  }

  let teacherProfile = await prisma.teacher.findFirst({
    where: {
      OR: [
        { userId: teacherUser.id },
        { employeeNumber: 'TCH-001' }
      ]
    }
  });

  if (teacherProfile) {
    teacherProfile = await prisma.teacher.update({
      where: { id: teacherProfile.id },
      data: {
        userId: teacherUser.id,
        employeeNumber: 'TCH-001',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        gender: Gender.MALE,
        phone: '+1 (555) 101-2001',
        email: 'ahmed.teacher@school.local',
        qualification: 'M.Sc. Mathematics',
        specialization: 'Pure Mathematics',
        status: TeacherStatus.ACTIVE
      }
    });
  } else {
    teacherProfile = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        employeeNumber: 'TCH-001',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        gender: Gender.MALE,
        phone: '+1 (555) 101-2001',
        email: 'ahmed.teacher@school.local',
        qualification: 'M.Sc. Mathematics',
        specialization: 'Pure Mathematics',
        status: TeacherStatus.ACTIVE
      }
    });
  }

  // Assign Ahmed to Grade 8A Mathematics
  await prisma.teacherSubjectClassAssignment.upsert({
    where: {
      teacherId_subjectId_classId_sectionId_academicYearId: {
        teacherId: teacherProfile.id,
        subjectId: mathSubject.id,
        classId: grade8.id,
        sectionId: sec8A.id,
        academicYearId: academicYear.id,
      }
    },
    update: {},
    create: {
      teacherId: teacherProfile.id,
      subjectId: mathSubject.id,
      classId: grade8.id,
      sectionId: sec8A.id,
      academicYearId: academicYear.id,
      termId: term1.id,
    }
  });

  // 9. Role Account: STUDENT (B20092 / Student123!)
  console.log('Configuring STUDENT account (B20092)...');
  const passwordHashStudent = await bcrypt.hash('Student123!', 10);

  let studentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'B20092' },
        { email: 'student.b20092@school.local' },
        { email: 'student@school.local' }
      ]
    }
  });

  if (studentUser) {
    studentUser = await prisma.user.update({
      where: { id: studentUser.id },
      data: {
        username: 'B20092',
        email: 'student.b20092@school.local',
        password: passwordHashStudent,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });
  } else {
    studentUser = await prisma.user.create({
      data: {
        username: 'B20092',
        email: 'student.b20092@school.local',
        password: passwordHashStudent,
        role: UserRole.STUDENT,
        firstName: 'Bilal',
        lastName: 'Farah',
        phone: '+1 (555) 200-9200',
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      }
    });
  }

  let studentProfile = await prisma.student.findFirst({
    where: {
      OR: [
        { userId: studentUser.id },
        { studentNumber: 'B20092' }
      ]
    }
  });

  if (studentProfile) {
    studentProfile = await prisma.student.update({
      where: { id: studentProfile.id },
      data: {
        userId: studentUser.id,
        studentNumber: 'B20092',
        admissionNumber: 'ADM-20092',
        firstName: 'Bilal',
        lastName: 'Farah',
        gender: Gender.MALE,
        dateOfBirth: new Date('2012-05-14'),
        phone: '+1 (555) 200-9200',
        email: 'student.b20092@school.local',
        guardianName: 'Farah Jama',
        guardianPhone: '+1 (555) 200-9201',
        relationship: 'Father',
        status: StudentStatus.ACTIVE
      }
    });
  } else {
    studentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        studentNumber: 'B20092',
        admissionNumber: 'ADM-20092',
        firstName: 'Bilal',
        lastName: 'Farah',
        gender: Gender.MALE,
        dateOfBirth: new Date('2012-05-14'),
        phone: '+1 (555) 200-9200',
        email: 'student.b20092@school.local',
        guardianName: 'Farah Jama',
        guardianPhone: '+1 (555) 200-9201',
        relationship: 'Father',
        status: StudentStatus.ACTIVE
      }
    });
  }

  // Enroll Student in Grade 8A
  await prisma.enrollment.upsert({
    where: {
      studentId_academicYearId: {
        studentId: studentProfile.id,
        academicYearId: academicYear.id
      }
    },
    update: {
      classId: grade8.id,
      sectionId: sec8A.id,
      status: StudentStatus.ACTIVE
    },
    create: {
      studentId: studentProfile.id,
      academicYearId: academicYear.id,
      classId: grade8.id,
      sectionId: sec8A.id,
      status: StudentStatus.ACTIVE
    }
  });

  console.log('\n======================================================');
  console.log('✅ Real Role Accounts Successfully Generated:');
  console.log('------------------------------------------------------');
  console.log('1. ADMIN ROLE:');
  console.log('   Email:    admin@gmail.com');
  console.log('   Password: 123321@Admin');
  console.log('------------------------------------------------------');
  console.log('2. TEACHER ROLE:');
  console.log('   Username: ahmed.teacher');
  console.log('   Password: Teacher123!');
  console.log('   Class:    Grade 8A (Mathematics)');
  console.log('------------------------------------------------------');
  console.log('3. STUDENT ROLE:');
  console.log('   Student ID: B20092');
  console.log('   Password:   Student123!');
  console.log('   Class:      Grade 8A');
  console.log('======================================================');
  console.log('School Name: School Management System');
  console.log('No demo/fake data remaining in the database.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error executing clean role seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
